import { dispatchPerplexityAgent } from './src/lib/perplexity';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const task = {
    bountyId: "test-123",
    objective: "I need a videographer in NYC for a 2 day shoot.",
    constraints: ["Budget ceiling: $2000 USD", "Must have high end portfolio"],
    maxBudget: 2000,
    callbackUrl: "test",
  };

  try {
    console.log("Dispatching...");
    const res = await dispatchPerplexityAgent(task);
    console.log("\nSuccess Parsing! Selected Vendor:\n", res.selectedVendor);
  } catch (e) {
    console.error("Error:", e);
  }
})();
