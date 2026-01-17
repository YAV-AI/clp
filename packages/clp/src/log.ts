import { Proposal } from "./proposal";

export interface LogEntry {
  timestamp: Date;
  intentName: string;
  intentPayload: Record<string, any>;
  stagedProposal?: Proposal;
  acceptedProposal?: Proposal;
  guardOutcomes: Array<{ name: string; denied: boolean }>;
  transitionAttempted?: string;
  transitionResult: { name?: string; permitted: boolean };
  stateDiff: Record<string, any>;
}
