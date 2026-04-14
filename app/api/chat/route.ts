import { NextRequest } from "next/server";
import getFavicons from "favicon-extractor";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  message: string;
  provider: "OpenAI" | "Gemini" | "Perplexity";
  apiKey: string;
  messages?: ChatMessage[];
}

/** Unified response shape returned by every provider handler */
interface ProviderResult {
  text: string;
  citations?: string[];
  icons?: object[];
}

async function callPerplexityAPI(
  message: string,
  apiKey: string,
  messages: ChatMessage[] = []
): Promise<ProviderResult> {
  const model = "sonar-pro";

  const allMessages = [
    ...messages,
    { role: "user" as const, content: message },
  ];

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: allMessages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Perplexity API error: ${response.status} ${response.statusText} — ${errorText}`
    );
  }

  const data = await response.json();
  const text: string =
    data.choices?.[0]?.message?.content || "No response received";
  const citations: string[] = data.citations ?? [];
  let icons: object[] = [];
  if (citations.length > 0) {
    try {
      icons = (await getFavicons(citations)) ?? [];
    } catch {
      icons = [];
    }
  }
  return { text, citations, icons };
}

async function callOpenAIAPI(
  message: string,
  apiKey: string,
  messages: ChatMessage[] = []
): Promise<ProviderResult> {
  const model = "gpt-3.5-turbo";

  const allMessages = [
    ...messages,
    { role: "user" as const, content: message },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: allMessages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText} — ${errorText}`
    );
  }

  const data = await response.json();
  const text: string =
    data.choices?.[0]?.message?.content || "No response received";
  return { text, citations: [], icons: [] };
}

async function callGeminiAPI(
  message: string,
  apiKey: string,
  messages: ChatMessage[] = []
): Promise<ProviderResult> {
  // gemini-2.0-flash is the current stable default
  const model = "gemini-2.0-flash";

  // Build multi-turn contents array for Gemini
  const contents = [
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText} — ${errorText}`
    );
  }

  const data = await response.json();
  const text: string =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";
  return { text, citations: [], icons: [] };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, provider, apiKey, messages = [] } = body;

    if (!message || !provider || !apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: message, provider, or apiKey",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let result: ProviderResult;

    switch (provider) {
      case "Perplexity":
        result = await callPerplexityAPI(message, apiKey, messages);
        break;
      case "OpenAI":
        result = await callOpenAIAPI(message, apiKey, messages);
        break;
      case "Gemini":
        result = await callGeminiAPI(message, apiKey, messages);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unsupported provider" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(
      JSON.stringify({
        text: result.text,
        citations: result.citations ?? [],
        icons: result.icons ?? [],
        provider,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
