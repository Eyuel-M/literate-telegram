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
  id:      string;
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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured in .env.local" }, { status: 500 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const {
      message,
      history        = [],
      files          = [] as FilePayload[],
      moodboardItems = [] as MbItem[],
    } = body;

    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    /* ── Build system context text ── */
    const contextParts: string[] = [];

    const notes  = (moodboardItems as MbItem[]).filter(i => i.type === "NOTE");
    const images = (moodboardItems as MbItem[]).filter(i => i.type === "IMAGE");

    if (notes.length > 0) {
      contextParts.push(
        "## Moodboard Notes\n" +
        notes.map((n, idx) => `Note ${idx + 1}: ${n.content || "(empty)"}`).join("\n"),
      );
    }
    if (images.length > 0) {
      contextParts.push(
        `## Moodboard Images (${images.length} total)\n` +
        images.map((img, idx) =>
          `Image ${idx + 1}: ${img.content}${img.label ? ` — caption: "${img.label}"` : ""}`,
        ).join("\n"),
      );
    }

    const textFiles = (files as FilePayload[]).filter(f => !f.isBase64);
    if (textFiles.length > 0) {
      contextParts.push(
        "## Uploaded Files\n" +
        textFiles.map(f => `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n"),
      );
    }

    const systemText = contextParts.length > 0
      ? `You are a creative AI assistant embedded in a moodboard tool. You have access to:\n\n${contextParts.join("\n\n")}\n\nHelp the user understand and analyze their moodboard content, images, notes, and any uploaded files. Be concise and insightful.`
      : "You are a creative AI assistant embedded in a moodboard tool. Answer the user's questions helpfully.";

    /* ── Build inline data parts ── */
    const inlineParts: Part[] = [];

    for (const f of (files as FilePayload[]).filter(f => f.isBase64)) {
      inlineParts.push({ inlineData: { mimeType: f.mimeType, data: f.content } });
    }

    // Local moodboard images — read from disk, deduplicate by content path
    const uniqueImages = images.filter((img, idx, arr) =>
      arr.findIndex(a => a.content === img.content) === idx,
    );
    for (const img of uniqueImages.slice(0, 6)) {
      if (!img.content.startsWith("/uploads/")) continue;
      const r = await localImageToBase64(img.content);
      if (r) inlineParts.push({ inlineData: { mimeType: r.mimeType, data: r.data } });
    }

    /* ── Call Gemini ── */
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        { role: "user",  parts: [{ text: "You are ready." }] },
        { role: "model", parts: [{ text: "Ready to help with your moodboard and files." }] },
        ...(history as { role: string; content: string }[]).map(h => ({
          role:  h.role === "assistant" ? ("model" as const) : ("user" as const),
          parts: [{ text: h.content }],
        })),
      ],
    });

    const messageParts: Part[] = [
      { text: systemText },
      ...inlineParts,
      { text: message },
    ];

    const result = await chat.sendMessageStream(messageParts);

    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(enc.encode(chunk.text()));
          }
        } catch (streamErr) {
          controller.enqueue(enc.encode(`\n\n[Stream error: ${streamErr instanceof Error ? streamErr.message : "unknown"}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

  } catch (err: unknown) {
    console.error("[ai-chat] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
