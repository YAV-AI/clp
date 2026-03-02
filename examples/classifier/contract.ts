import { createContract } from "../../packages/clp";

const ALLOWED_CATEGORIES = [
  "tech",
  "sports",
  "business",
  "entertainment",
  "science",
];

export const classifierContract = createContract({
  intents: {
    classifyText: {
      inputs: {
        text: "string",
      },
    },
  },

  state: {
    classifications: "array",
    lastCategory: "string?",
  },

  guards: [
    {
      name: "must_have_text",
      deny: (context) => {
        if (context.intent.name === "classifyText") {
          return (
            !context.intent.payload.text ||
            context.intent.payload.text.trim().length === 0
          );
        }
        return false;
      },
    },
    {
      name: "category_must_be_allowed",
      deny: (context) => {
        if (context.intent.name === "classifyText") {
          const category = context.intent.payload.category;
          if (category && !ALLOWED_CATEGORIES.includes(category)) {
            return true;
          }
        }
        return false;
      },
    },
  ],

  transitions: {
    applyClassification: {
      when: (context) => context.intent.complete,
      effects: (context) => ({
        classifications: [
          ...(context.state.classifications || []),
          {
            text: context.intent.payload.text,
            category: context.intent.payload.category,
            timestamp: new Date().toISOString(),
          },
        ],
        lastCategory: context.intent.payload.category,
      }),
    },
  },
});
