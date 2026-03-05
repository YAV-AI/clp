import { createRuntime, Intent, Proposal } from "@yav-ai/clp";
import { flightContract } from "./contract";

const getFutureDate = (daysAhead: number = 30): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split("T")[0];
};

const flightAI = async (intent: Intent): Promise<Proposal> => {
  if (intent.name === "searchFlights" && !intent.payload.date) {
    return { date: getFutureDate(30) };
  }
  return {};
};

export const flightApp = createRuntime(flightContract, flightAI);
