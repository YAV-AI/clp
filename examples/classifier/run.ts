import { app } from "./app";

async function run() {
  console.log("=== Text Classification with CLP ===\n");

  // Example 1: Tech text
  console.log("1. Classifying tech text...");
  app.dispatch("classifyText", { text: "The new AI software is amazing!" });

  const proposal1 = await app.propose("classifyText");
  console.log("   AI Proposal:", proposal1);

  if (proposal1 && proposal1.category) {
    app.acceptProposal("classifyText");
    app.commit("applyClassification");
    console.log("   Category:", app.getState("lastCategory"));
  }
  console.log(
    "   Log:",
    app.getLog()[0].transitionResult.permitted ? "Success" : "Failed",
  );

  // Example 2: Sports text
  console.log("\n2. Classifying sports text...");
  app.dispatch("classifyText", {
    text: "The football team won the game yesterday",
  });

  const proposal2 = await app.propose("classifyText");
  console.log("   AI Proposal:", proposal2);

  if (proposal2 && proposal2.category) {
    app.acceptProposal("classifyText");
    app.commit("applyClassification");
    console.log("   Category:", app.getState("lastCategory"));
  }

  // Example 3: Guard test - invalid category (simulated)
  // This would fail if AI returned an invalid category
  console.log("\n3. Testing guard with invalid category...");
  app.dispatch("classifyText", {
    text: "Some random text",
    category: "invalid_category",
  });

  try {
    app.commit("applyClassification");
    console.log("   ERROR: Should have been blocked by guard!");
  } catch (e) {
    console.log("   Guard blocked invalid category:", (e as Error).message);
  }

  // Example 4: Guard test - empty text
  console.log("\n4. Testing guard with empty text...");
  app.dispatch("classifyText", { text: "" });

  try {
    app.commit("applyClassification");
    console.log("   ERROR: Should have been blocked by guard!");
  } catch (e) {
    console.log("   Guard blocked empty text:", (e as Error).message);
  }

  console.log("\n=== All classifications ===");
  console.log(app.getState("classifications"));
  console.log("\n=== Audit Log ===");
  console.log(app.getLog());
}

run();
