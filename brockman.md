# The Brockman Formula: Anatomy of an o1 Prompt

According to Greg Brockman (OpenAI), o1 performance is maximized by structuring prompts into four distinct sections:

## 1. Goal
State exactly what you want the model to achieve and the primary constraints.
*   *Example:* "I want a list of the best unique weekend getaways within two hours of New York City. Each destination should provide a cool and unique experience and be lesser known."

## 2. Return Format
Define the precise structure, data points, and quantity of the output. 
*   *Example:* "For each getaway, return the name of the destination as I'd find it on travel guides, then provide the starting address, the ending address (if applicable), distance, drive time, duration of the experience, and what makes it a cool and unique adventure. Return the top 3."

## 3. Warnings
Provide specific quality guardrails, verification steps, or common pitfalls to avoid.
*   *Example:* "Be careful to make sure that the name of the location is correct, that it actually exists, and that the time is correct."

## 4. Context Dump (The "Separator")
Provide a long-form grounding of metadata, personal preferences, or situational background. Use a separator (like `--`) to distinguish this from the core instructions.
*   *Example:* "For context: my partner and I love exploring! We've done pretty much all of the well-known spots in our city... [followed by personal details about past trips, current mood, and specific requirements like water views or historical sites]."

---
*Source: Greg Brockman (@gdb)*
