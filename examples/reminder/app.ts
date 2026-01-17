import { createRuntime, Intent, Proposal } from "../../packages/clp";
import { reminderContract } from "./contract";

const mockAI = async (intent: Intent): Promise<Proposal> => {
  if (intent.name === "createReminder" && !intent.payload.date) {
    return { date: "2023-12-01" };
  }
  return {};
};

export const app = createRuntime(reminderContract, mockAI);
