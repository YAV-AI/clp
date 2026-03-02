import { IntentDef } from "./intent";
import { StateDef } from "./state";
import { Guard } from "./guard";
import { Transition } from "./transition";

export interface Contract {
  intents: Record<string, IntentDef>;
  state: StateDef;
  guards: Guard[];
  transitions: Record<string, Transition>;
}

export function createContract(config: Contract): Contract {
  return {
    ...config,
  };
}
