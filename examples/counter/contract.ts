import { createContract } from "@yav-ai/clp";

export const counterContract = createContract({
  intents: {
    increment: {
      inputs: {
        amount: "number?",
      },
    },
  },

  state: {
    count: "number",
  },

  guards: [
    {
      name: "no_negative_increment",
      deny: (context) =>
        context.intent.payload.amount != null &&
        context.intent.payload.amount < 0,
    },
  ],

  transitions: {
    applyIncrement: {
      when: (context) => context.intent.complete,
      effects: (context) => ({
        count:
          (context.state.count ?? 0) + (context.intent.payload.amount ?? 1),
      }),
    },
  },
});
