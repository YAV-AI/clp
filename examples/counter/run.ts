import { app } from "./app";

async function run() {
  console.log("Initial count:", app.getState("count"));

  app.dispatch("increment", {});

  const proposal = await app.propose("increment");
  console.log("AI proposal:", proposal);

  if (proposal) {
    app.acceptProposal("increment");
  }

  app.commit("applyIncrement");

  console.log("Final count:", app.getState("count"));
  console.log("Log:", app.getLog());
}

run();
