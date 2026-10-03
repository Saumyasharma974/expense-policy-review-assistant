import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { PrismaClient, PolicySection } from '@prisma/client';
import { getGroqModel } from './groq';
import { ReviewGraphState } from './state';
import { SYSTEM_CLASSIFY_PROMPT, SYSTEM_COMPLIANCE_PROMPT } from './prompts';
import { AiClassificationSchema, AiComplianceAssessmentSchema, AiClassification, AiComplianceAssessment } from 'shared';
import { logger } from '../utils/logger';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const prisma = new PrismaClient();

// Define Graph State Annotation
const GraphAnnotation = Annotation.Root({
  claim: Annotation<ReviewGraphState['claim']>(),
  policyCandidates: Annotation<ReviewGraphState['policyCandidates']>({
    reducer: (state, update) => update,
    default: () => []
  }),
  classification: Annotation<AiClassification>({
    reducer: (state, update) => update,
  }),
  compliance: Annotation<AiComplianceAssessment>({
    reducer: (state, update) => update,
  }),
  isEvidenceVerified: Annotation<boolean>({
    reducer: (state, update) => update,
    default: () => false
  }),
  error: Annotation<string>({
    reducer: (state, update) => update,
  }),
  workflowId: Annotation<string>(),
  messages: Annotation<any[]>({
    reducer: (state, update) => update,
    default: () => []
  }),
});

async function retrievePolicyCandidates(state: typeof GraphAnnotation.State) {
  const { workflowId } = state;
  logger.info({ workflowId, stage: 'retrievePolicyCandidates' }, 'Retrieving policy candidates');
  
  const policies = await prisma.policySection.findMany();
  
  return {
    policyCandidates: policies.map((p: PolicySection) => ({
      id: p.id,
      category: p.title, // map title to category
      content: p.content
    }))
  };
}

async function classifyClaim(state: typeof GraphAnnotation.State) {
  const { claim, workflowId } = state;
  logger.info({ workflowId, stage: 'classifyClaim' }, 'Classifying claim');

  try {
    const model = getGroqModel();
    const structuredModel = model.withStructuredOutput(AiClassificationSchema, { name: 'classify' });
    
    const userMessage = `Claim Description: """${claim.description}"""\nCategory provided by user: ${claim.category || 'None'}`;
    
    const classification = await structuredModel.invoke([
      new SystemMessage(SYSTEM_CLASSIFY_PROMPT),
      new HumanMessage(userMessage)
    ]);

    return { classification };
  } catch (error: any) {
    logger.error({ workflowId, err: error }, 'Classification failed');
    return { error: 'Classification failed: ' + error.message };
  }
}

async function assessPolicyCompliance(state: typeof GraphAnnotation.State) {
  const { claim, policyCandidates, classification, workflowId } = state;
  logger.info({ workflowId, stage: 'assessPolicyCompliance' }, 'Assessing compliance');

  if (!classification) return {};

  try {
    // Filter candidates based on classification
    let relevantPolicies = policyCandidates.filter(p => 
      p.category.toUpperCase().includes(classification.classification.toUpperCase())
    );

    // Fallback if no exact match or low confidence
    if (relevantPolicies.length === 0 || classification.confidence < 70) {
      relevantPolicies = policyCandidates;
    }

    const policyText = relevantPolicies.map(p => `[ID: ${p.id}] [Category: ${p.category}]\n${p.content}`).join('\n\n');

    const model = getGroqModel();
    const structuredModel = model.withStructuredOutput(AiComplianceAssessmentSchema, { name: 'assess' });

    const userMessage = `
--- CLAIM DATA (UNTRUSTED) ---
Description: """${claim.description}"""
Amount: ${claim.amountMinorUnits} ${claim.currency}
Receipt Available: ${claim.receiptAvailable}
------------------------------

--- AUTHORITATIVE POLICIES ---
${policyText}
------------------------------
`;

    const compliance = await structuredModel.invoke([
      new SystemMessage(SYSTEM_COMPLIANCE_PROMPT),
      new HumanMessage(userMessage)
    ]);

    return { compliance };
  } catch (error: any) {
    logger.error({ workflowId, err: error }, 'Compliance assessment failed');
    return { error: 'Compliance assessment failed: ' + error.message };
  }
}

async function identifyMissingInformation(state: typeof GraphAnnotation.State) {
  const { workflowId, compliance } = state;
  logger.info({ workflowId, stage: 'identifyMissingInformation' }, 'Checking for missing info');
  if (compliance?.missingInformation && compliance.missingInformation.length > 0) {
    logger.info({ workflowId, missingInfo: compliance.missingInformation }, 'Missing information identified');
  }
  return {};
}

async function verifyEvidence(state: typeof GraphAnnotation.State) {
  const { workflowId, compliance, policyCandidates } = state;
  logger.info({ workflowId, stage: 'verifyEvidence' }, 'Verifying evidence');

  if (!compliance) return { isEvidenceVerified: false };
  if (!compliance.policyEvidence || compliance.policyEvidence.trim() === '') {
    return { isEvidenceVerified: true }; // No evidence provided, maybe uncertain
  }

  // Exact substring check
  const evidence = compliance.policyEvidence.trim();
  let isVerified = false;

  for (const policy of policyCandidates) {
    if (policy.content.includes(evidence)) {
      isVerified = true;
      break;
    }
  }

  if (!isVerified) {
    logger.warn({ workflowId, evidence }, 'Fabricated evidence detected!');
    return {
      isEvidenceVerified: false,
      compliance: {
        ...compliance,
        uncertainty: true,
        complianceStatus: 'NEEDS_MANUAL_REVIEW',
        explanation: 'AI provided invalid policy evidence. Manual review required. Original explanation: ' + compliance.explanation
      }
    };
  }

  return { isEvidenceVerified: true };
}

async function persistAIReview(state: typeof GraphAnnotation.State) {
  const { workflowId, claim, classification, compliance, error, isEvidenceVerified } = state;
  logger.info({ workflowId, stage: 'persistAIReview' }, 'Persisting review');

  try {
    let payload = {
      workflowId,
      classification,
      compliance,
      isEvidenceVerified,
      error
    };

    if (error) {
      await prisma.reviewHistory.create({
        data: {
          claimId: claim.id,
          actorType: 'SYSTEM',
          action: 'AI_REVIEW_FAILED',
          reason: error,
          payload: JSON.stringify(payload)
        }
      });
      
      await prisma.expenseClaim.update({
        where: { id: claim.id },
        data: { finalStatus: 'MANUAL_REVIEW_REQUIRED' }
      });
    } else if (classification && compliance) {
      let policySectionId: string | null = null;
      if (isEvidenceVerified && compliance.policyEvidence) {
        const policy = state.policyCandidates.find(p => p.content.includes(compliance.policyEvidence.trim()));
        if (policy) policySectionId = policy.id;
      }

      await prisma.aiFinding.create({
        data: {
          claimId: claim.id,
          classification: classification.classification,
          confidence: classification.confidence,
          complianceStatus: compliance.complianceStatus,
          explanation: compliance.explanation,
          uncertainty: compliance.uncertainty,
          missingInformation: compliance.missingInformation,
          clarificationQuestion: compliance.clarificationQuestion,
          policyEvidence: compliance.policyEvidence,
          policySectionId: policySectionId
        }
      });

      await prisma.reviewHistory.create({
        data: {
          claimId: claim.id,
          actorType: 'AI',
          action: 'AI_REVIEW_COMPLETED',
          payload: JSON.stringify(payload)
        }
      });
    }
    return {};
  } catch (e: any) {
    logger.error({ workflowId, err: e }, 'Failed to persist AI review');
    return { error: 'Persistence failed: ' + e.message };
  }
}

// Router functions
function routeAfterClassify(state: typeof GraphAnnotation.State) {
  if (state.error) return 'persistAIReview';
  return 'assessPolicyCompliance';
}

function routeAfterAssess(state: typeof GraphAnnotation.State) {
  if (state.error) return 'persistAIReview';
  return 'identifyMissingInformation';
}

// Build graph
const builder = new StateGraph(GraphAnnotation)
  .addNode('retrievePolicyCandidates', retrievePolicyCandidates)
  .addNode('classifyClaim', classifyClaim)
  .addNode('assessPolicyCompliance', assessPolicyCompliance)
  .addNode('identifyMissingInformation', identifyMissingInformation)
  .addNode('verifyEvidence', verifyEvidence)
  .addNode('persistAIReview', persistAIReview)
  
  .addEdge(START, 'retrievePolicyCandidates')
  .addEdge('retrievePolicyCandidates', 'classifyClaim')
  .addConditionalEdges('classifyClaim', routeAfterClassify)
  .addConditionalEdges('assessPolicyCompliance', routeAfterAssess)
  .addEdge('identifyMissingInformation', 'verifyEvidence')
  .addEdge('verifyEvidence', 'persistAIReview')
  .addEdge('persistAIReview', END);

export const aiReviewWorkflow = builder.compile();
