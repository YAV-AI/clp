import { createRuntime, Intent, Proposal } from "@yav-ai/clp";
import { classifierContract } from "./contract";

const ALLOWED_CATEGORIES = [
  "tech",
  "sports",
  "business",
  "entertainment",
  "science",
];

async function runTests() {
  console.log("=== Classifier Tests ===\n");

  // Test 1: AI classification works
  console.log("Test 1: AI classifies tech text");
  const ai = async (_intent: Intent): Promise<Proposal> => ({
    category: "tech",
  });
  const app1 = createRuntime(classifierContract, ai);
  app1.dispatch("classifyText", { text: "AI is great" });
  await app1.propose("classifyText");
  app1.acceptProposal("classifyText");
  app1.commit("applyClassification");
  console.log("Result:", app1.getState("lastCategory"));
  console.log("PASS\n");

  // Test 2: Guard blocks invalid category
  console.log("Test 2: Guard blocks invalid category");
  const app2 = createRuntime(classifierContract);
  app2.dispatch("classifyText", { text: "test", category: "invalid" });
  try {
    app2.commit("applyClassification");
    console.log("FAIL: Should have thrown\n");
  } catch (e) {
    console.log("PASS: Blocked -", (e as Error).message, "\n");
  }

  // Test 3: Guard blocks empty text
  console.log("Test 3: Guard blocks empty text");
  const app3 = createRuntime(classifierContract);
  app3.dispatch("classifyText", { text: "" });
  try {
    app3.commit("applyClassification");
    console.log("FAIL: Should have thrown\n");
  } catch (e) {
    console.log("PASS: Blocked -", (e as Error).message, "\n");
  }

  // Test 4: AI can only propose allowed categories
  console.log("Test 4: AI proposes category, user must accept");
  const badAI = async (_intent: Intent): Promise<Proposal> => ({
    category: "forbidden",
  });
  const app4 = createRuntime(classifierContract, badAI);
  app4.dispatch("classifyText", { text: "hello" });
  await app4.propose("classifyText");
  app4.acceptProposal("classifyText");
  try {
    app4.commit("applyClassification");
    console.log("FAIL: Should have thrown\n");
  } catch (e) {
    console.log("PASS: Guard blocked AI proposal:", (e as Error).message, "\n");
  }

  console.log("=== All Tests Complete ===");
}

runTests();
