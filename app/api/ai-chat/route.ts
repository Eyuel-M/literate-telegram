import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readdir, readFile, stat } from "fs/promises";
import { join, relative, extname, resolve } from "path";

const TEXT_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".txt",
  ".css", ".scss", ".html", ".yaml", ".yml", ".prisma", ".sql",
]);
const MAX_FILE  = 50_000;
const MAX_TOTAL = 400_000;

async function collectFiles(
  dir: string,
  base: string,
  out: { path: string; content: string }[],
  total: { v: number },
) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }

  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === ".next") continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await collectFiles(full, base, out, total);
    } else if (e.isFile()) {
      if (!TEXT_EXTS.has(extname(e.name).toLowerCase())) continue;
      if (total.v >= MAX_TOTAL) continue;
      try {
        const s = await stat(full);
        if (s.size > MAX_FILE) continue;
        const content = await readFile(full, "utf-8");
        out.push({ path: relative(base, full), content: content.slice(0, MAX_FILE) });
        total.v += content.length;
      } catch { /* skip unreadable */ }
    }
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

  const { message, directory, history = [] } = await req.json();
  if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

  const cwd      = process.cwd();
  const resolved = directory ? resolve(cwd, directory) : cwd;
  if (!resolved.startsWith(cwd)) {
    return NextResponse.json({ error: "Invalid directory path" }, { status: 400 });
  }

  const files: { path: string; content: string }[] = [];
  await collectFiles(resolved, resolved, files, { v: 0 });

  const dirLabel = relative(cwd, resolved) || ".";
  const fileContext = files.length
    ? files.map(f => `\`\`\`\n// ${f.path}\n${f.content}\n\`\`\``).join("\n\n")
    : "(no text files found)";

  const systemPrompt = [
    `You are an expert code assistant. The user has loaded the directory "${dirLabel}" containing ${files.length} file(s).`,
    `Here are the file contents:\n\n${fileContext}`,
    `Answer questions about this codebase concisely and accurately. Use markdown formatting.`,
  ].join("\n\n");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const chat = model.startChat({
    history: [
      { role: "user",  parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: `Understood. I've analyzed ${files.length} file(s) in "${dirLabel}". Ask me anything about them.` }] },
      ...(history as { role: string; content: string }[]).map(h => ({
        role:  h.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: h.content }],
      })),
    ],
  });

  const result = await chat.sendMessageStream(message);

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
