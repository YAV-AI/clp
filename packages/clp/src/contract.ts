import { IntentDef } from "./intent";
import { StateDef } from "./state";
import { Guard } from "./guard";
import { Transition } from "./transition";
import { Evaluation } from "./evaluation";

export interface Contract {
  intents: Record<string, IntentDef>;
  state: StateDef;
  guards: Guard[];
  transitions: Record<string, Transition>;
  evaluations: Evaluation[];
}

export class Contract {
  static create(config: Omit<Contract, "evaluations">): Contract {
    return {
      ...config,
      evaluations: [],
    };
  }
}
