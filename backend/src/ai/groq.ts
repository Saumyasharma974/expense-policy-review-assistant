import { ChatGroq } from '@langchain/groq';
import { logger } from '../utils/logger';

export function getGroqModel() {
  if (!process.env.GROQ_API_KEY) {
    logger.error('GROQ_API_KEY is missing');
    throw new Error('GROQ_API_KEY environment variable is missing');
  }

  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0,
  });
}
