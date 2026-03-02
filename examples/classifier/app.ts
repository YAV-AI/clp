import { createRuntime, Intent, Proposal } from "../../packages/clp";
import { classifierContract } from "./contract";

// Simulated LLM that classifies text
// In production, this would call OpenAI, Anthropic, etc.
const classifierAI = async (intent: Intent): Promise<Proposal> => {
  if (intent.name === "classifyText" && intent.payload.text) {
    const text = intent.payload.text.toLowerCase();

    // Simple keyword-based classification (simulates LLM)
    let category = "general";

    if (
      text.includes("ai") ||
      text.includes("software") ||
      text.includes("code") ||
      text.includes("tech")
    ) {
      category = "tech";
    } else if (
      text.includes("football") ||
      text.includes("soccer") ||
      text.includes("game") ||
      text.includes("player")
    ) {
      category = "sports";
    } else if (
      text.includes("stock") ||
      text.includes("market") ||
      text.includes("company") ||
      text.includes("money")
    ) {
      category = "business";
    } else if (
      text.includes("movie") ||
      text.includes("music") ||
      text.includes("celebrity") ||
      text.includes("film")
    ) {
      category = "entertainment";
    } else if (
      text.includes("research") ||
      text.includes("study") ||
      text.includes("discovery") ||
      text.includes("space")
    ) {
      category = "science";
    }

    return { category };
  }
  return {};
};

export const app = createRuntime(classifierContract, classifierAI);
