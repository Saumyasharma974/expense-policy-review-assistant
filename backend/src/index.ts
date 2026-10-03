import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { HealthCheckSchema, ReviewActionPayloadSchema } from 'shared';
import { PrismaClient } from '@prisma/client';
import { validateClaim } from './services/claimValidationService';
import { analyzeClaim } from './services/aiReviewService';
import { processHumanReview } from './services/humanReviewService';

dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173';
app.use(cors({ origin: frontendUrl }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Verify DB connection
    await prisma.$queryRaw`SELECT 1`;
    const response = HealthCheckSchema.parse({ status: 'ok' });
    res.json(response);
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.post('/api/claims/:id/validate', async (req: Request, res: Response) => {
  try {
    const claimId = req.params.id;
    const result = await validateClaim(claimId);
    res.json(result);
  } catch (error) {
    logger.error({ err: error, claimId: req.params.id }, 'Validation endpoint failed');
    if (error instanceof Error && error.message === 'Claim not found') {
      res.status(404).json({ status: 'error', message: 'Claim not found' });
    } else {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
});

app.post('/api/claims/:id/analyze', async (req: Request, res: Response) => {
  try {
    const claimId = req.params.id;
    // 1. Run deterministic validation (could throw if not found)
    const validation = await validateClaim(claimId);
    
    // 2. Run AI Analysis
    const analysis = await analyzeClaim(claimId);
    
    res.json({
      claimId,
      validation,
      analysis
    });
  } catch (error) {
    logger.error({ err: error, claimId: req.params.id }, 'Analyze endpoint failed');
    if (error instanceof Error && error.message === 'Claim not found') {
      res.status(404).json({ status: 'error', message: 'Claim not found' });
    } else {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
});

app.get('/api/claims', async (req: Request, res: Response) => {
  try {
    const claims = await prisma.expenseClaim.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(claims);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch claims');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

app.get('/api/claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.expenseClaim.findUnique({
      where: { id: req.params.id },
      include: {
        deterministic: { orderBy: { createdAt: 'desc' } },
        aiFindings: { orderBy: { createdAt: 'desc' } },
        reviews: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!claim) {
      res.status(404).json({ status: 'error', message: 'Claim not found' });
      return;
    }
    
    // Evaluate deterministic validation on the fly to reflect latest rules (e.g. date age)
    const validationResult = await validateClaim(claim.id);
    (claim as any).deterministic = validationResult.findings;

    res.json(claim);
  } catch (error) {
    logger.error({ err: error, claimId: req.params.id }, 'Failed to fetch claim');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

app.post('/api/claims/:id/review', async (req: Request, res: Response) => {
  try {
    const payload = ReviewActionPayloadSchema.parse(req.body);
    const result = await processHumanReview(req.params.id, payload);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error, claimId: req.params.id }, 'Review endpoint failed');
    if (error.name === 'ZodError') {
      res.status(400).json({ status: 'error', message: 'Invalid payload', details: error.errors });
    } else if (error.message === 'Claim not found') {
      res.status(404).json({ status: 'error', message: 'Claim not found' });
    } else {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
});

app.listen(port, () => {
  logger.info(`Backend listening at http://localhost:${port}`);
});

