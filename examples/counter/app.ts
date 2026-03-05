import { createRuntime, Intent, Proposal } from "@yav-ai/clp";
import { counterContract } from "./contract";

const counterAI = async (intent: Intent): Promise<Proposal> => {
  if (intent.name === "increment" && intent.payload.amount == null) {
    return { amount: 1 };
  }
  return {};
};

export const app = createRuntime(counterContract, counterAI);
