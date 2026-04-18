# The Brockman Formula: Agentic Perplexity Edition (2026)

According to Greg Brockman (President, OpenAI), reasoning model performance is maximized by structuring prompts into four distinct sections. To optimize this specifically for the **Perplexity Agent API**, we integrate the official 2026 Prompt Guide heuristics.

## 1. Goal (The "Instructions")
State exactly what you want the model to achieve and the primary constraints.
*   **Perplexity Tip:** Separate the *Instructions* (the "How") from the *Input* (the "What"). Use the `instructions` field in the API for cross-cutting logic and the `input` field for the specific user request. 
*   **Example:** "You are an autonomous procurement agent. Your primary goal is to identify three vendors that meet the technical requirements provided in the Context Dump."

## 2. Return Format (The "Output Control")
Define the precise structure, data points, and quantity of the output. 
*   **Perplexity Tip (Citations):** The Language Generation component cannot "see" raw URLs in real-time. **NEVER** ask the model to guess or write out a URL string. Instead, force it to use numerical citations (e.g., `[1]`) and map them to the `search_results` array.
*   **Example:** "Return a JSON object. For the `websiteUrl` field, use the numerical citation index from your search tools (e.g., `[3]`). Do not include any text outside the JSON block."

## 3. Warnings (The "Hallucination Guard")
Provide specific quality guardrails, verification steps, or common pitfalls to avoid.
*   **Perplexity Tip:** Explicitly instruct the model to state "No relevant information found" rather than providing speculative or hallucinated data.
*   **Example:** "If a LinkedIn profile cannot be found for a vendor, set that field to null. Always prioritize information from verified review platforms over personal blog claims."

## 4. Context Dump (The "Grounding")
Provide a long-form grounding of metadata, personal preferences, or situational background. Use a separator (like `--`) to distinguish this from the core instructions.
*   **Perplexity Tip:** Use "Built-in Parameters" over "Prompt-based Control." If you want to restrict search to a specific domain (e.g., Wikipedia), use the `search_domain_filter` API parameter rather than writing it in this section.
*   **Technical Detail:** Use `web_search_options.search_context_size: "high"` in your API call if the Context Dump contains a massive amount of technical jargon requiring deep retrieval.

---
*Source: Greg Brockman (@gdb) x Perplexity Developer Relations*
