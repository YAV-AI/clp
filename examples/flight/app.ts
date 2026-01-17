import { createRuntime, Intent, Proposal } from "../../packages/clp";
import { flightContract } from "./contract";

const flightAI = async (intent: Intent): Promise<Proposal> => {
  if (intent.name === "searchFlights" && !intent.payload.date) {
    return { date: "2027-12-01" };
  }
  return {};
};

export const flightApp = createRuntime(flightContract, flightAI);
