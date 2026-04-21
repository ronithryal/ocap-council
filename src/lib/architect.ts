import { ArchitectPlan } from '@/types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/v1/agent';

/**
 * Given a bounty description, ask a fast LLM to identify the most relevant
 * GitHub repos whose contributors are most likely to have solved the described problem.
 * Returns a minimal ArchitectPlan with only targetRepos populated.
 * Falls back to an empty targetRepos array on any failure — never throws.
 */
export async function buildArchitectPlan(
  objective: string,
  category?: string,
): Promise<Pick<ArchitectPlan, 'targetRepos'>> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) return { targetRepos: [] };

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preset: 'pro-search',
        input: `Task: "${objective}"${category ? ` (Category: ${category})` : ''}\n\nIdentify the most relevant open-source GitHub repositories whose contributors have likely solved this type of problem in real production code. Focus on repositories with active PR history and non-trivial commits.\n\nReturn ONLY a raw JSON object in this exact format, no markdown:\n{"targetRepos": ["owner/repo", "owner/repo", "owner/repo"]}`,
        instructions:
          'You are a technical sourcing assistant. Return only a raw JSON object with a targetRepos array of "owner/repo" strings. No markdown. No explanation. No other keys.',
        return_citations: false,
      }),
    });

    if (!response.ok) return { targetRepos: [] };

    const data = await response.json();
    const messageItem = data.output?.find((o: any) => o.type === 'message');
    const text: string = messageItem?.content?.find((c: any) => c.type === 'output_text')?.text ?? '';

    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (!braceMatch) return { targetRepos: [] };

    const parsed = JSON.parse(braceMatch[0]);
    const repos: string[] = Array.isArray(parsed.targetRepos)
      ? parsed.targetRepos.filter((r: any) => typeof r === 'string' && r.includes('/'))
      : [];

    console.info(`[Architect] targetRepos resolved: ${repos.join(', ') || 'none'}`);
    return { targetRepos: repos };
  } catch (err) {
    console.warn('[Architect] buildArchitectPlan failed silently:', err);
    return { targetRepos: [] };
  }
}
