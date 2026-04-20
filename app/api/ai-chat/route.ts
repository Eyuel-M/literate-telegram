import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
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
  id:      string;
  type:    "IMAGE" | "NOTE";
  content: string;
  label:   string | null;
  x:       number;
  y:       number;
}

/* ─── Provider detection ─────────────────────────────────────────── */

type Provider = "groq" | "ollama" | "gemini";

function detectProvider(preferred?: string): Provider {
  const order: Provider[] = ["groq", "ollama", "gemini"];
  const configured: Record<Provider, boolean> = {
    groq:   !!process.env.GROQ_API_KEY,
    ollama: !!process.env.OLLAMA_BASE_URL,
    gemini: !!process.env.GEMINI_API_KEY,
  };

  // Use preferred if it's configured
  if (preferred && configured[preferred as Provider]) return preferred as Provider;

  // Otherwise fall through in default order
  const found = order.find(p => configured[p]);
  if (!found) throw new Error(
    "No AI provider configured. Add one of these to .env.local:\n" +
    "  GROQ_API_KEY=...       (free at console.groq.com)\n" +
    "  OLLAMA_BASE_URL=http://localhost:11434\n" +
    "  GEMINI_API_KEY=...",
  );
  return found;
}

function makeOpenAIClient(): { client: OpenAI; model: string } {
  const provider = detectProvider();
  if (provider === "groq") {
    return {
      client: new OpenAI({
        apiKey:  process.env.GROQ_API_KEY!,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: process.env.GROQ_MODEL || "llama-3.2-11b-vision-preview",
    };
  }
  // Ollama — OpenAI-compatible local server
  return {
    client: new OpenAI({
      apiKey:  "ollama",
      baseURL: (process.env.OLLAMA_BASE_URL || "http://localhost:11434") + "/v1",
    }),
    model: process.env.OLLAMA_MODEL || "llava",
  };
}

/* ─── Local image helper ─────────────────────────────────────────── */

async function localImageToBase64(urlPath: string): Promise<{ data: string; mimeType: string } | null> {
  if (!urlPath.startsWith("/uploads/")) return null;
  const filename = urlPath.replace("/uploads/", "");
  const ext      = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif",  webp: "image/webp", avif: "image/avif",
  };
  try {
    const buf = await readFile(join(process.cwd(), "public", "uploads", filename));
    return { data: buf.toString("base64"), mimeType: mimeMap[ext] ?? "image/jpeg" };
  } catch { return null; }
}

/* ─── Build shared context ───────────────────────────────────────── */

async function buildContext(
  files:          FilePayload[],
  moodboardItems: MbItem[],
) {
  const contextParts: string[] = [];

  const notes  = moodboardItems.filter(i => i.type === "NOTE");
  const images = moodboardItems.filter(i => i.type === "IMAGE")
    .filter((img, idx, arr) => arr.findIndex(a => a.content === img.content) === idx);

  if (notes.length)  contextParts.push("## Moodboard Notes\n"  + notes.map((n, i)   => `Note ${i+1}: ${n.content || "(empty)"}`).join("\n"));
  if (images.length) contextParts.push("## Moodboard Images\n" + images.map((img, i) => `Image ${i+1}: ${img.content}${img.label ? ` — "${img.label}"` : ""}`).join("\n"));

  const textFiles = files.filter(f => !f.isBase64);
  if (textFiles.length) {
    contextParts.push("## Uploaded Files\n" + textFiles.map(f => `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n"));
  }

  // Collect inline image data (user uploads + local moodboard images)
  const inlineImages: { mimeType: string; data: string }[] = [];

  for (const f of files.filter(f => f.isBase64)) {
    inlineImages.push({ mimeType: f.mimeType, data: f.content });
  }
  for (const img of images.slice(0, 6)) {
    if (!img.content.startsWith("/uploads/")) continue;
    const r = await localImageToBase64(img.content);
    if (r) inlineImages.push(r);
  }

  const systemText = contextParts.length > 0
    ? `You are a creative AI assistant embedded in a moodboard design tool.\n\nContext:\n${contextParts.join("\n\n")}\n\nAnalyze the moodboard, images, notes, and files. Be concise and insightful.`
    : "You are a creative AI assistant embedded in a moodboard design tool. Answer helpfully.";

  return { systemText, inlineImages };
}

/* ─── Route ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const {
      message,
      history        = [],
      files          = [] as FilePayload[],
      moodboardItems = [] as MbItem[],
      provider:      preferredProvider,
    } = body;

    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    let provider: Provider;
    try { provider = detectProvider(preferredProvider); }
    catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }

    const { systemText, inlineImages } = await buildContext(files, moodboardItems);

    /* ── Gemini path ── */
    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

      const chat = model.startChat({
        history: [
          { role: "user",  parts: [{ text: "Ready." }] },
          { role: "model", parts: [{ text: "Ready to help." }] },
          ...(history as { role: string; content: string }[]).map(h => ({
            role:  h.role === "assistant" ? ("model" as const) : ("user" as const),
            parts: [{ text: h.content }],
          })),
        ],
      });

      const parts: Part[] = [
        { text: systemText },
        ...inlineImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
        { text: message },
      ];

      const result = await chat.sendMessageStream(parts);

      const stream = new ReadableStream({
        async start(controller) {
          const enc = new TextEncoder();
          try {
            for await (const chunk of result.stream) controller.enqueue(enc.encode(chunk.text()));
          } catch (e) {
            const msg = (e instanceof Error ? e.message : "error").split("\n")[0].slice(0, 200);
            controller.enqueue(enc.encode(`\n\n[Error: ${msg}]`));
          } finally { controller.close(); }
        },
      });
      return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    /* ── Groq / Ollama path (OpenAI-compatible) ── */
    const { client, model } = makeOpenAIClient();

    type TextPart     = { type: "text"; text: string };
    type ImagePart    = { type: "image_url"; image_url: { url: string } };
    type ContentPart  = TextPart | ImagePart;

    const userContent: ContentPart[] = [{ type: "text", text: systemText }];

    for (const img of inlineImages) {
      userContent.push({
        type:      "image_url",
        image_url: { url: `data:${img.mimeType};base64,${img.data}` },
      });
    }
    userContent.push({ type: "text", text: message });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system",    content: "You are a creative AI assistant for a moodboard design tool." },
      ...(history as { role: string; content: string }[]).map(h => ({
        role:    (h.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: h.content,
      })),
      { role: "user", content: inlineImages.length > 0 ? userContent : systemText + "\n\n" + message },
    ];

    const completion = await client.chat.completions.create({
      model,
      messages,
      stream:     true,
      max_tokens: 2048,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(enc.encode(text));
          }
        } catch (e) {
          const msg = (e instanceof Error ? e.message : "error").split("\n")[0].slice(0, 200);
          controller.enqueue(enc.encode(`\n\n[Error: ${msg}]`));
        } finally { controller.close(); }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

  } catch (err: unknown) {
    console.error("[ai-chat]", err);
    const msg = (err instanceof Error ? err.message : "Internal error").split("\n")[0].slice(0, 300);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
