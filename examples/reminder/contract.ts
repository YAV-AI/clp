import { createContract } from "../../packages/clp";

export const reminderContract = createContract({
  intents: {
    createReminder: {
      inputs: {
        text: "string",
        date: "date?",
      },
    },
  },

  state: {
    reminder: {
      text: "string",
      date: "date",
    },
  },

  guards: [
    {
      name: "must_have_date",
      deny: (context) => context.intent.payload.date == null,
    },
  ],

  transitions: {
    saveReminder: {
      when: (context) => context.intent.complete,
      effects: (context) => ({
        reminder: {
          text: context.intent.payload.text,
          date: context.intent.payload.date,
        },
      }),
    },
  },
});
