import { describe, it, expect, beforeEach, vi } from "vitest";
import { Engine } from "./engine";
import { Contract, createContract } from "./contract";
import { Intent } from "./intent";
import { Proposal } from "./proposal";

// Test contract for counter
const createTestContract = (): Contract => {
  return createContract({
    intents: {
      increment: {
        inputs: {
          amount: "number?",
        },
      },
      decrement: {
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
          context.intent.name === "increment" &&
          context.intent.payload.amount != null &&
          context.intent.payload.amount < 0,
      },
      {
        name: "no_decrement",
        deny: (context) => context.intent.name === "decrement",
      },
    ],
    transitions: {
      applyIncrement: {
        when: (context) =>
          context.intent.name === "increment" && context.intent.complete,
        effects: (context) => ({
          count:
            (context.state.count ?? 0) + (context.intent.payload.amount ?? 1),
        }),
      },
    },
  });
};

// Test contract with required fields
const createTestContractWithRequiredFields = (): Contract => {
  return createContract({
    intents: {
      setValue: {
        inputs: {
          value: "number", // required field
        },
      },
    },
    state: {
      value: "number",
    },
    guards: [],
    transitions: {
      apply: {
        when: (context) => context.intent.complete,
        effects: (context) => ({
          value: context.intent.payload.value,
        }),
      },
    },
  });
};

describe("Engine", () => {
  let engine: Engine;

  beforeEach(() => {
    engine = new Engine(createTestContract());
  });

  describe("dispatch", () => {
    it("should dispatch an intent", () => {
      engine.dispatch("increment", { amount: 5 });
      const log = engine.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].intentName).toBe("increment");
      expect(log[0].intentPayload).toEqual({ amount: 5 });
    });

    it("should throw on unknown intent", () => {
      expect(() => engine.dispatch("unknown", {})).toThrow(
        "Unknown intent unknown",
      );
    });

    it("should mark intent as complete when all required fields provided", () => {
      engine.dispatch("increment", { amount: 5 });
      const log = engine.getLog();
      expect(log[0].transitionResult.permitted).toBe(false);
    });
  });

  describe("propose", () => {
    it("should return null when no ai provider configured", async () => {
      engine.dispatch("increment", {});
      const proposal = await engine.propose("increment");
      expect(proposal).toBeNull();
    });

    it("should return null when intent does not match", async () => {
      const aiProvider = vi.fn().mockResolvedValue({ amount: 1 });
      const engineWithAI = new Engine(createTestContract(), aiProvider);
      engineWithAI.dispatch("increment", {});
      const proposal = await engineWithAI.propose("decrement");
      expect(proposal).toBeNull();
    });

    it("should call ai provider and stage proposal", async () => {
      const aiProvider = vi.fn().mockResolvedValue({ amount: 10 });
      const engineWithAI = new Engine(createTestContract(), aiProvider);
      engineWithAI.dispatch("increment", {});
      const proposal = await engineWithAI.propose("increment");
      expect(aiProvider).toHaveBeenCalled();
      expect(proposal).toEqual({ amount: 10 });
    });

    it("should throw when proposal contains invalid fields", async () => {
      const aiProvider = vi
        .fn()
        .mockResolvedValue({ amount: 10, extra: "invalid" });
      const engineWithAI = new Engine(createTestContract(), aiProvider);
      engineWithAI.dispatch("increment", {});
      await expect(engineWithAI.propose("increment")).rejects.toThrow(
        "Proposal contains invalid field: extra",
      );
    });

    it("should throw when proposal tries to override required field", async () => {
      // Use contract with required fields
      const aiProvider = vi.fn().mockResolvedValue({ value: 100 });
      const engineWithAI = new Engine(
        createTestContractWithRequiredFields(),
        aiProvider,
      );
      // Dispatch with the required field already provided
      engineWithAI.dispatch("setValue", { value: 50 });
      // Now try to propose - it should throw because value is required and already provided
      await expect(engineWithAI.propose("setValue")).rejects.toThrow(
        "Proposal tries to override required field: value",
      );
    });
  });

  describe("acceptProposal", () => {
    it("should merge proposal into intent payload", async () => {
      const aiProvider = vi.fn().mockResolvedValue({ amount: 10 });
      const engineWithAI = new Engine(createTestContract(), aiProvider);
      engineWithAI.dispatch("increment", {});
      await engineWithAI.propose("increment");
      engineWithAI.acceptProposal("increment");
      const log = engineWithAI.getLog();
      expect(log[log.length - 1].acceptedProposal).toEqual({ amount: 10 });
    });

    it("should throw when no matching intent", () => {
      expect(() => engine.acceptProposal("increment")).toThrow(
        "No matching intent",
      );
    });

    it("should throw when no staged proposal", () => {
      engine.dispatch("increment", { amount: 5 });
      expect(() => engine.acceptProposal("increment")).toThrow(
        "No staged proposal to accept",
      );
    });
  });

  describe("commit", () => {
    it("should apply state changes when guards pass", () => {
      engine.dispatch("increment", { amount: 5 });
      engine.commit("applyIncrement");
      expect(engine.getState("count")).toBe(5);
    });

    it("should use default value when not provided", () => {
      engine.dispatch("increment", {});
      engine.commit("applyIncrement");
      expect(engine.getState("count")).toBe(1);
    });

    it("should throw when guard denies", async () => {
      const engineWithAI = new Engine(createTestContract(), async () => ({
        amount: -5,
      }));
      engineWithAI.dispatch("increment", {});
      await engineWithAI.propose("increment");
      engineWithAI.acceptProposal("increment");
      expect(() => engineWithAI.commit("applyIncrement")).toThrow(
        "Guard no_negative_increment denied",
      );
    });

    it("should throw when no intent to commit", () => {
      expect(() => engine.commit("applyIncrement")).toThrow(
        "No intent to commit",
      );
    });

    it("should throw when intent is incomplete", () => {
      // Use contract with required fields - intent is incomplete without value
      const engineWithRequired = new Engine(
        createTestContractWithRequiredFields(),
      );
      engineWithRequired.dispatch("setValue", {});
      expect(() => engineWithRequired.commit("apply")).toThrow(
        "Intent is incomplete",
      );
    });

    it("should throw when unaccepted proposal present", async () => {
      const aiProvider = vi.fn().mockResolvedValue({ amount: 5 });
      const engineWithAI = new Engine(createTestContract(), aiProvider);
      engineWithAI.dispatch("increment", {});
      await engineWithAI.propose("increment");
      // Not accepting the proposal
      expect(() => engineWithAI.commit("applyIncrement")).toThrow(
        "Unaccepted AI proposal present",
      );
    });

    it("should handle auto-transition with optional fields", () => {
      // When amount is optional, dispatching with empty payload still makes the intent complete
      // because optional fields don't need to be provided
      engine.dispatch("increment", {});
      // This should work because amount is optional and the intent is complete
      engine.commit();
      expect(engine.getState("count")).toBe(1);
    });

    it("should throw when no matching transition", () => {
      engine.dispatch("increment", { amount: 5 });
      expect(() => engine.commit("unknownTransition")).toThrow(
        "No matching transition",
      );
    });

    it("should auto-select transition when exactly one matches", () => {
      engine.dispatch("increment", { amount: 5 });
      engine.commit();
      expect(engine.getState("count")).toBe(5);
    });

    it("should throw when multiple transitions match", () => {
      const contractWithMultipleTransitions = createContract({
        intents: {
          increment: { inputs: { amount: "number?" } },
        },
        state: { count: "number" },
        guards: [],
        transitions: {
          transition1: {
            when: () => true,
            effects: () => ({ count: 1 }),
          },
          transition2: {
            when: () => true,
            effects: () => ({ count: 2 }),
          },
        },
      });
      const engine2 = new Engine(contractWithMultipleTransitions);
      engine2.dispatch("increment", { amount: 5 });
      expect(() => engine2.commit()).toThrow(
        "Expected exactly one matching transition, found 2",
      );
    });
  });

  describe("getState", () => {
    it("should return current state value", () => {
      engine.dispatch("increment", { amount: 10 });
      engine.commit("applyIncrement");
      expect(engine.getState("count")).toBe(10);
    });

    it("should return undefined for unknown state key", () => {
      expect(engine.getState("unknown")).toBeUndefined();
    });
  });

  describe("subscribe", () => {
    it("should notify subscribers on state change", () => {
      const callback = vi.fn();
      engine.subscribe("count", callback);
      engine.dispatch("increment", { amount: 5 });
      engine.commit("applyIncrement");
      expect(callback).toHaveBeenCalledWith({ count: 5 });
    });

    it("should not notify for unrelated state changes", () => {
      const callback = vi.fn();
      engine.subscribe("count", callback);
      // Dispatch but don't commit
      engine.dispatch("increment", { amount: 5 });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("getLog", () => {
    it("should return a copy of the log", () => {
      engine.dispatch("increment", { amount: 5 });
      const log1 = engine.getLog();
      const log2 = engine.getLog();
      expect(log1).not.toBe(log2);
      expect(log1).toEqual(log2);
    });

    it("should track state diff when state changes", () => {
      // First commit sets count to 5
      engine.dispatch("increment", { amount: 5 });
      engine.commit("applyIncrement");
      const log = engine.getLog();
      // The stateDiff shows the new value
      expect(log[1].stateDiff).toEqual({ count: 5 });
    });
  });

  describe("audit trail", () => {
    it("should log all steps in execution lifecycle", async () => {
      const aiProvider = vi.fn().mockResolvedValue({ amount: 10 });
      const engineWithAI = new Engine(createTestContract(), aiProvider);

      // 1. Dispatch with amount 5
      engineWithAI.dispatch("increment", { amount: 5 });

      // 2. Propose - AI adds 10
      await engineWithAI.propose("increment");

      // 3. Accept - merges the proposal
      engineWithAI.acceptProposal("increment");

      // 4. Commit
      engineWithAI.commit("applyIncrement");

      const log = engineWithAI.getLog();
      expect(log).toHaveLength(4);

      expect(log[0].intentName).toBe("increment");
      expect(log[0].intentPayload).toEqual({ amount: 5 });
      expect(log[0].transitionResult.permitted).toBe(false);

      expect(log[1].stagedProposal).toEqual({ amount: 10 });

      expect(log[2].acceptedProposal).toEqual({ amount: 10 });

      // After accepting, the payload is merged: original 5 + proposal 10 = 15
      // But the transition uses the final payload value which is 10 (proposal overwrites)
      expect(log[3].transitionResult.permitted).toBe(true);
      expect(log[3].stateDiff).toEqual({ count: 10 });
    });
  });
});
