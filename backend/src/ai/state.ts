import { 
  AiClassification, 
  AiComplianceAssessment, 
} from 'shared';
import { BaseMessage } from '@langchain/core/messages';

export interface PolicyCandidate {
  id: string;
  category: string;
  content: string;
}

export interface ExpenseClaimData {
  id: string;
  category: string | null;
  description: string;
  amountMinorUnits: number;
  currency: string;
  receiptAvailable: boolean;
}

export interface ReviewGraphState {
  claim: ExpenseClaimData;
  policyCandidates: PolicyCandidate[];
  classification?: AiClassification;
  compliance?: AiComplianceAssessment;
  isEvidenceVerified?: boolean;
  messages: BaseMessage[]; // For any conversational/tracing state if needed
  error?: string;
  workflowId: string;
}
