import { createRuntime, Intent, Proposal } from "@yav-ai/clp";
import { reminderContract } from "./contract";

const getFutureDate = (daysAhead: number = 7): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split("T")[0];
};

async function runTests() {
  // Test 1: Normal with AI
  console.log("Test 1: Normal with AI");
  const mockAI = async (intent: Intent): Promise<Proposal> => {
    if (intent.name === "createReminder" && !intent.payload.date) {
      return { date: getFutureDate(7) };
    }
    return {};
  };

  const app1 = createRuntime(reminderContract, mockAI);
  app1.dispatch("createReminder", { text: "Pay rent" });

  const proposal = await app1.propose("createReminder");
  console.log("Proposal:", proposal);

  if (proposal && Object.keys(proposal).length > 0) {
    app1.acceptProposal("createReminder");
  }

  app1.commit("saveReminder");
  console.log("State:", app1.getState("reminder"));

  // Test 2: Without AI, manual completion
  console.log("\nTest 2: Without AI, manual completion");
  const app2 = createRuntime(reminderContract);
  app2.dispatch("createReminder", {
    text: "Pay rent",
    date: getFutureDate(7),
  });
  app2.commit("saveReminder");
  console.log("State:", app2.getState("reminder"));

  // Test 3: AI tries to introduce new field
  console.log("\nTest 3: AI tries to introduce new field");
  const badAI = async (_intent: Intent): Promise<Proposal> => {
    return { date: getFutureDate(7), extra: "invalid" };
  };

  const app3 = createRuntime(reminderContract, badAI);
  app3.dispatch("createReminder", { text: "Pay rent" });

  try {
    await app3.propose("createReminder");
    console.log("ERROR: Should have thrown");
  } catch (e) {
    console.log("Correctly threw:", (e as Error).message);
  }

  console.log("\nAll tests passed");
}

runTests();
