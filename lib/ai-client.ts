import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Default model - Llama 3.3 70B is the latest and best
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export async function chatCompletion({
  messages,
  maxTokens = 500,
  temperature = 0.7,
  model = DEFAULT_MODEL,
}: ChatCompletionOptions): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    return completion.choices[0]?.message?.content || "Unable to generate response";
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("Failed to generate AI response");
  }
}

// Available Groq models (all free!)
export const GROQ_MODELS = {
  LLAMA_70B: "llama-3.3-70b-versatile", // Best quality (latest)
  LLAMA_8B: "llama-3.1-8b-instant", // Fastest
  MIXTRAL: "mixtral-8x7b-32768", // Good balance
  GEMMA: "gemma2-9b-it", // Google's model
} as const;

