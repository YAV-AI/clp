import { createRuntime, Intent, Proposal } from "@yav-ai/clp";
import { reminderContract } from "./contract";

const getFutureDate = (daysAhead: number = 7): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split("T")[0];
};

const mockAI = async (intent: Intent): Promise<Proposal> => {
  if (intent.name === "createReminder" && !intent.payload.date) {
    return { date: getFutureDate(7) };
  }
  return {};
};

export const app = createRuntime(reminderContract, mockAI);
