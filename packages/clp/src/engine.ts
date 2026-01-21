import { Contract } from "./contract";
import { Intent } from "./intent";
import { State } from "./state";
import { Context } from "./guard";
import { Transition } from "./transition";
import { Proposal } from "./proposal";
import { LogEntry } from "./log";

export class Engine {
  private contract: Contract;
  private state: State = {};
  private log: LogEntry[] = [];
  private subscribers: Map<string, ((state: State) => void)[]> = new Map();
  private currentIntent?: Intent;
  private stagedProposal?: Proposal;
  private aiProvider?: (intent: Intent) => Promise<Proposal>;

  constructor(
    contract: Contract,
    aiProvider?: (intent: Intent) => Promise<Proposal>,
  ) {
    this.contract = contract;
    this.aiProvider = aiProvider;
  }

  dispatch(intentName: string, payload: Record<string, any>): void {
    const intent = this.createIntent(intentName, payload);
    this.currentIntent = intent;

    // Log intent received
    this.log.push({
      timestamp: new Date(),
      intentName: intent.name,
      intentPayload: { ...intent.payload },
      guardOutcomes: [],
      transitionResult: { permitted: false },
      stateDiff: {},
    });
  }

  async propose(intentName: string): Promise<Proposal | null> {
    if (!this.currentIntent || this.currentIntent.name !== intentName) {
      return null;
    }
    if (!this.aiProvider) {
      return null;
    }
    const proposal = await this.aiProvider(this.currentIntent);
    // Validate proposal
    const intentDef = this.contract.intents[intentName];
    const allowedKeys = new Set(Object.keys(intentDef.inputs));
    for (const key in proposal) {
      if (!allowedKeys.has(key)) {
        throw new Error(`Proposal contains invalid field: ${key}`);
      }
      // Only fill missing or optional fields
      const type = intentDef.inputs[key];
      if (!type.endsWith("?") && key in this.currentIntent.payload) {
        throw new Error(`Proposal tries to override required field: ${key}`);
      }
    }
    // Stage proposal
    this.stagedProposal = proposal;
    // Log
    this.log.push({
      timestamp: new Date(),
      intentName: this.currentIntent.name,
      intentPayload: { ...this.currentIntent.payload },
      stagedProposal: proposal,
      guardOutcomes: [],
      transitionResult: { permitted: false },
      stateDiff: {},
    });
    return proposal;
  }

  acceptProposal(intentName: string): void {
    if (!this.currentIntent || this.currentIntent.name !== intentName) {
      throw new Error("No matching intent");
    }
    if (!this.stagedProposal) {
      throw new Error("No staged proposal to accept");
    }
    // Merge
    Object.assign(this.currentIntent.payload, this.stagedProposal);
    // Update completeness
    const intentDef = this.contract.intents[intentName];
    this.currentIntent.complete = this.isComplete(
      this.currentIntent.payload,
      intentDef.inputs,
    );
    // Log acceptance
    this.log.push({
      timestamp: new Date(),
      intentName: this.currentIntent.name,
      intentPayload: { ...this.currentIntent.payload },
      acceptedProposal: this.stagedProposal,
      guardOutcomes: [],
      transitionResult: { permitted: false },
      stateDiff: {},
    });
    // Clear staged proposal
    this.stagedProposal = undefined;
  }

  commit(transitionName?: string): void {
    if (!this.currentIntent) {
      throw new Error("No intent to commit");
    }
    // Check for unaccepted proposal
    if (this.stagedProposal) {
      throw new Error("Unaccepted AI proposal present");
    }
    // Check if intent is complete
    if (!this.currentIntent.complete) {
      throw new Error("Intent is incomplete");
    }

    const context: Context = { intent: this.currentIntent, state: this.state };

    // Guards
    const guardOutcomes: Array<{ name: string; denied: boolean }> = [];
    for (const guard of this.contract.guards) {
      const denied = guard.deny(context);
      guardOutcomes.push({ name: guard.name, denied });
      if (denied) {
        this.log.push({
          timestamp: new Date(),
          intentName: this.currentIntent.name,
          intentPayload: { ...this.currentIntent.payload },
          stagedProposal: this.stagedProposal,
          guardOutcomes,
          transitionAttempted: transitionName,
          transitionResult: { permitted: false },
          stateDiff: {},
        });
        throw new Error(`Guard ${guard.name} denied`);
      }
    }

    // Find transition
    let transition: Transition | undefined;
    let transitionNameUsed: string | undefined;
    if (transitionName) {
      transition = this.contract.transitions[transitionName];
      transitionNameUsed = transitionName;
    } else {
      const matchingTransitions: string[] = [];
      for (const [name, t] of Object.entries(this.contract.transitions)) {
        if (t.when(context)) {
          matchingTransitions.push(name);
        }
      }
      if (matchingTransitions.length !== 1) {
        throw new Error(
          `Expected exactly one matching transition, found ${matchingTransitions.length}`,
        );
      }
      transition = this.contract.transitions[matchingTransitions[0]];
      transitionNameUsed = matchingTransitions[0];
    }

    if (!transition) {
      this.log.push({
        timestamp: new Date(),
        intentName: this.currentIntent.name,
        intentPayload: { ...this.currentIntent.payload },
        stagedProposal: this.stagedProposal,
        guardOutcomes,
        transitionAttempted: transitionName,
        transitionResult: { permitted: false },
        stateDiff: {},
      });
      throw new Error("No matching transition");
    }

    // Apply effects (shallow merge in v0.1)
    const newState = { ...this.state, ...transition.effects(context) };
    const stateDiff = this.computeDiff(this.state, newState);
    this.state = newState;

    // Log
    this.log.push({
      timestamp: new Date(),
      intentName: this.currentIntent.name,
      intentPayload: { ...this.currentIntent.payload },
      stagedProposal: this.stagedProposal,
      guardOutcomes,
      transitionAttempted: transitionNameUsed,
      transitionResult: { name: transitionNameUsed, permitted: true },
      stateDiff,
    });

    // Notify subscribers
    for (const [key, callbacks] of this.subscribers) {
      if (key in stateDiff) {
        callbacks.forEach((cb) => cb(this.state));
      }
    }

    this.currentIntent = undefined;
    this.stagedProposal = undefined;
  }

  getState(stateName: string): any {
    return this.state[stateName];
  }

  /**
   * Subscribe to changes in a top-level state key.
   * Only observes top-level state keys, not nested properties.
   */
  subscribe(stateName: string, callback: (state: State) => void): void {
    if (!this.subscribers.has(stateName)) {
      this.subscribers.set(stateName, []);
    }
    this.subscribers.get(stateName)!.push(callback);
  }

  getLog(): LogEntry[] {
    return [...this.log];
  }

  private createIntent(
    intentName: string,
    payload: Record<string, any>,
  ): Intent {
    const intentDef = this.contract.intents[intentName];
    if (!intentDef) {
      throw new Error(`Unknown intent ${intentName}`);
    }
    return {
      name: intentName,
      payload: { ...payload },
      complete: this.isComplete(payload, intentDef.inputs),
    };
  }

  private isComplete(
    payload: Record<string, any>,
    inputs: Record<string, string>,
  ): boolean {
    for (const [key, type] of Object.entries(inputs)) {
      if (type.endsWith("?")) continue;
      if (!(key in payload) || payload[key] == null) return false;
    }
    return true;
  }

  private computeDiff(oldState: State, newState: State): Record<string, any> {
    const diff: Record<string, any> = {};
    for (const key in newState) {
      if (!(key in oldState) || newState[key] !== oldState[key]) {
        diff[key] = newState[key];
      }
    }
    return diff;
  }
}
