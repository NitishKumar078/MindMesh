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

async function callPerplexityAPI(
  message: string,
  apiKey: string,
  messages: ChatMessage[] = []
) {
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
    throw new Error(
      `Perplexity API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  // console.log(data.citations);
  data.icons = await getFavicons(data.citations);
  //return data.choices[0]?.message?.content || "No response received";
  return data || "No response received";
}

async function callOpenAIAPI(
  message: string,
  apiKey: string,
  messages: ChatMessage[] = []
) {
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
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "No response received";
}

async function callGeminiAPI(
  message: string,
  apiKey: string
  // messages: ChatMessage[] = []
) {
  // Note: This is a simplified implementation. Gemini API structure may differ
  const model = "gemini-pro";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received"
  );
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

    let response: string;

    switch (provider) {
      case "Perplexity":
        response = await callPerplexityAPI(message, apiKey, messages);
        break;
      case "OpenAI":
        response = await callOpenAIAPI(message, apiKey, messages);
        break;
      case "Gemini":
        response = await callGeminiAPI(message, apiKey);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unsupported provider" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(
      JSON.stringify({
        response,
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
