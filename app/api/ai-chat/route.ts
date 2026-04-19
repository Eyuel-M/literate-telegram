import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { readFile } from "fs/promises";
import { join } from "path";

/* ─── Types ──────────────────────────────────────────────────────── */

interface FilePayload {
  name:     string;
  mimeType: string;
  content:  string;
  isBase64: boolean;
  size:     number;
}

interface MbItem {
  type:    "IMAGE" | "NOTE";
  content: string;
  label:   string | null;
  x:       number;
  y:       number;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

async function localImageToBase64(urlPath: string): Promise<{ data: string; mimeType: string } | null> {
  if (!urlPath.startsWith("/uploads/")) return null;
  const filename = urlPath.replace("/uploads/", "");
  const ext      = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif",  webp: "image/webp", avif: "image/avif",
  };
  const mimeType = mimeMap[ext] ?? "image/jpeg";
  try {
    const buf = await readFile(join(process.cwd(), "public", "uploads", filename));
    return { data: buf.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

/* ─── Route ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

  const {
    message,
    history        = [],
    files          = [] as FilePayload[],
    moodboardItems = [] as MbItem[],
  } = await req.json();

  if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

  /* ── Build system context text ── */
  const contextParts: string[] = [];

  // Moodboard
  if (moodboardItems.length > 0) {
    const notes  = moodboardItems.filter((i: MbItem) => i.type === "NOTE");
    const images = moodboardItems.filter((i: MbItem) => i.type === "IMAGE");

    if (notes.length > 0) {
      contextParts.push(
        "## Moodboard Notes\n" +
        notes.map((n: MbItem, idx: number) => `Note ${idx + 1}: ${n.content || "(empty)"}`).join("\n"),
      );
    }
    if (images.length > 0) {
      contextParts.push(
        "## Moodboard Images\n" +
        images.map((img: MbItem, idx: number) =>
          `Image ${idx + 1}: ${img.content}${img.label ? ` (caption: "${img.label}")` : ""}`,
        ).join("\n"),
      );
    }
  }

  // Text/code files
  const textFiles = (files as FilePayload[]).filter(f => !f.isBase64);
  if (textFiles.length > 0) {
    contextParts.push(
      "## Uploaded Files\n" +
      textFiles.map(f => `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n"),
    );
  }

  const systemText = contextParts.length > 0
    ? `You are a creative and technical AI assistant. You have been given the following context to help answer questions:\n\n${contextParts.join("\n\n")}\n\nUse this context to give accurate, helpful answers. If the user asks about the moodboard, analyze the notes, images, and overall creative direction.`
    : "You are a helpful AI assistant for a creative workflow platform.";

  /* ── Build inline data parts for binary files ── */
  const inlineParts: Part[] = [];

  // User-uploaded images / PDFs
  for (const f of (files as FilePayload[]).filter(f => f.isBase64)) {
    inlineParts.push({
      inlineData: { data: f.content, mimeType: f.mimeType },
    } as Part);
  }

  // Local moodboard images (from /uploads/)
  const mbImages = (moodboardItems as MbItem[]).filter(i => i.type === "IMAGE" && i.content.startsWith("/uploads/"));
  for (const img of mbImages.slice(0, 8)) { // cap at 8 images
    const result = await localImageToBase64(img.content);
    if (result) {
      inlineParts.push({
        inlineData: { data: result.data, mimeType: result.mimeType },
      } as Part);
    }
  }

  /* ── Call Gemini ── */
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const chat = model.startChat({
    history: [
      { role: "user",  parts: [{ text: "System context loaded." }] },
      { role: "model", parts: [{ text: "Understood. I'm ready to help with your moodboard, files, or any questions." }] },
      ...(history as { role: string; content: string }[]).map(h => ({
        role:  h.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: h.content }],
      })),
    ],
  });

  // Current message: system context + any inline data + user's question
  const messageParts: Part[] = [
    { text: systemText } as Part,
    ...inlineParts,
    { text: message }    as Part,
  ];

  const result = await chat.sendMessageStream(messageParts);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const chunk of result.stream) {
          controller.enqueue(enc.encode(chunk.text()));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
