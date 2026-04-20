import { NextResponse } from "next/server";

export async function GET() {
  const configured: Record<string, boolean> = {
    groq:   !!process.env.GROQ_API_KEY,
    ollama: !!process.env.OLLAMA_BASE_URL,
    gemini: !!process.env.GEMINI_API_KEY,
  };

  let active = "none";
  if (configured.groq)   active = "groq";
  else if (configured.ollama) active = "ollama";
  else if (configured.gemini) active = "gemini";

  return NextResponse.json({ active, configured });
}
