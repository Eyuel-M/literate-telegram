import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.GROQ_API_KEY)    return NextResponse.json({ provider: "Groq" });
  if (process.env.OLLAMA_BASE_URL) return NextResponse.json({ provider: "Ollama" });
  if (process.env.GEMINI_API_KEY)  return NextResponse.json({ provider: "Gemini" });
  return NextResponse.json({ provider: "Not configured" });
}
