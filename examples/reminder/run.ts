import { app } from "./app";

async function run() {
  // Test with AI proposal
  app.dispatch("createReminder", {
    text: "Pay rent",
  });

  console.log("State before proposal:", app.getState("reminder"));

  const proposal = await app.propose("createReminder");
  console.log("Proposal:", proposal);

  if (proposal && Object.keys(proposal).length > 0) {
    app.acceptProposal("createReminder");
  }

  app.commit("saveReminder");

  console.log("State after commit:", app.getState("reminder"));
  console.log("Log:", app.getLog());
}

run();
