const GOOGLE_AI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
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
 * Generate an optimized prompt for blog post summarization
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

export async function generateSummary(postContent: string): Promise<string | null> {
  if (!GOOGLE_AI_API_KEY) {
    console.error("Google AI API key not configured");
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
        maxOutputTokens: 250, // Reduced from 300 for cost efficiency
        temperature: 0.7,
      },
    };

    const response = await fetch(`${GOOGLE_AI_ENDPOINT}?key=${GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google AI API error:", errorData);
      return null;
    }

    const data = await response.json();
    let summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      console.error("No summary generated from Google AI");
      return null;
    }

    // ✅ Ensure summary doesn't exceed reasonable length
    if (summary.length > 1500) {
      summary = summary.substring(0, 1500).trim() + "...";
    }

    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
}

export async function generateMultipleSummaries(
  posts: Array<{ id: string; body: string }>
): Promise<Map<string, string>> {
  const summaries = new Map<string, string>();

  for (const post of posts) {
    const summary = await generateSummary(post.body);
    if (summary) {
      summaries.set(post.id, summary);
    }
  }

  return summaries;
}
