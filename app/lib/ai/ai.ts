/**
 * ✅ SECURITY IMPROVEMENTS:
 * 
 * ## For Backend Code (API routes, services):
 * Use `generateSummary()` which uses GOOGLE_AI_API_KEY (server-only, no NEXT_PUBLIC_)
 * 
 * ## For Frontend Code (Components, pages):
 * Call `/api/ai/summarize` endpoint instead (API key never exposed)
 * 
 * The frontend should NEVER directly import this or use GOOGLE_AI_API_KEY
 */

const GOOGLE_AI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export interface GenerateContentRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

/**
 * ✅ BACKEND USE ONLY - Server-side API key
 * 
 * Generates summary using server-only Google AI API key (GOOGLE_AI_API_KEY)
 * This should only be called from backend code (API routes, services)
 * 
 * Frontend code should NOT call this - call /api/ai/summarize endpoint instead
 */
export async function generateSummary(
  postContent: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.error("[AI] GOOGLE_AI_API_KEY not configured on server");
    return null;
  }

  try {
    const prompt = createOptimizedPrompt(postContent);

    const request: GenerateContentRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
      },
    };

    const response = await fetch(`${GOOGLE_AI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[AI] Google API error:", errorData);
      return null;
    }

    const data = await response.json();
    let summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      console.error("[AI] No summary generated from Google API");
      return null;
    }

    // ✅ Ensure summary doesn't exceed reasonable length
    if (summary.length > 1500) {
      summary = summary.substring(0, 1500).trim() + "...";
    }

    return summary;
  } catch (error) {
    console.error("[AI] Error generating summary on server:", error);
    return null;
  }
}

/**
 * Create optimized prompt for blog post summarization
 * Improved for quality, brevity, and cost efficiency
 */
function createOptimizedPrompt(postContent: string): string {
  return `You are an expert blog summarizer. Create a compelling, highly readable summary 
of this blog post for casual readers. This summary will be displayed on a blog index page.

REQUIREMENTS:
- Length: 100-150 words (concise, not verbose)
- Format: One paragraph, engaging and scannable
- Style: Conversational, friendly, accessible tone
- Content: Main topic + 2-3 key points + key takeaway
- Quality: Clear, grammatically perfect, no jargon
- Do NOT include: Meta-commentary, repetition, promotional language, or disclaimers

Blog Post:
${postContent}

Return ONLY the summary. No prefix, no explanation, no "Here is the summary:".`;
}

/**
 * Generate multiple summaries in parallel
 * Reuses rate limiting checks from caller
 */
export async function generateMultipleSummaries(
  posts: Array<{ id: string; body: string }>
): Promise<Map<string, string>> {
  const summaries = new Map<string, string>();

  // Generate all summaries in parallel
  const results = await Promise.all(
    posts.map((post) => generateSummary(post.body))
  );

  // Map results back to post IDs
  for (let i = 0; i < posts.length; i++) {
    if (results[i]) {
      summaries.set(posts[i].id, results[i]!);
    }
  }

  return summaries;
}
