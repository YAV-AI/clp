import { Engine } from "./engine";
import { Contract } from "./contract";
import { Intent } from "./intent";
import { Proposal } from "./proposal";

export interface Runtime {
  dispatch(intentName: string, payload: Record<string, any>): void;
  propose(intentName: string): Promise<Proposal | null>;
  acceptProposal(intentName: string): void;
  commit(transitionName?: string): void;
  getState(key: string): any;
  subscribe(key: string, cb: (state: any) => void): void;
  getLog(): any[];
}

export function createRuntime(
  contract: Contract,
  aiProvider?: (intent: Intent) => Promise<Proposal>
): Runtime {
  return new Engine(contract, aiProvider);
}
