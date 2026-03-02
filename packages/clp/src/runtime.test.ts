import { describe, it, expect } from "vitest";
import { createRuntime } from "./runtime";
import { createContract } from "./contract";

describe("Runtime", () => {
  it("should create a runtime from a contract", () => {
    const contract = createContract({
      intents: {
        increment: { inputs: { amount: "number?" } },
      },
      state: { count: "number" },
      guards: [],
      transitions: {
        apply: {
          when: (ctx) => ctx.intent.complete,
          effects: (ctx) => ({
            count: (ctx.state.count ?? 0) + (ctx.intent.payload.amount ?? 1),
          }),
        },
      },
    });

    const runtime = createRuntime(contract);

    runtime.dispatch("increment", { amount: 5 });
    runtime.commit("apply");

    expect(runtime.getState("count")).toBe(5);
  });

  it("should create a runtime with AI provider", async () => {
    const contract = createContract({
      intents: {
        increment: { inputs: { amount: "number?" } },
      },
      state: { count: "number" },
      guards: [],
      transitions: {
        apply: {
          when: (ctx) => ctx.intent.complete,
          effects: (ctx) => ({
            count: (ctx.state.count ?? 0) + (ctx.intent.payload.amount ?? 1),
          }),
        },
      },
    });

    const aiProvider = async () => ({ amount: 10 });
    const runtime = createRuntime(contract, aiProvider);

    runtime.dispatch("increment", {});
    const proposal = await runtime.propose("increment");
    expect(proposal).toEqual({ amount: 10 });

    runtime.acceptProposal("increment");
    runtime.commit("apply");

    expect(runtime.getState("count")).toBe(10);
  });
});
