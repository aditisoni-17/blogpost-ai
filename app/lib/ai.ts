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

export async function generateSummary(postContent: string): Promise<string | null> {
  if (!GOOGLE_AI_API_KEY) {
    console.error("Google AI API key not configured");
    return null;
  }

  try {
    const prompt = `Please generate a concise summary of the following blog post in approximately 200 words. Focus on the main points and key takeaways:

${postContent}

Provide only the summary, without any introduction or concluding remarks.`;

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
        maxOutputTokens: 300,
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
    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      console.error("No summary generated from Google AI");
      return null;
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
