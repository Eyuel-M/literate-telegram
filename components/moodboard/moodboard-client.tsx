"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { StickyNote, ImagePlus, X, Check, Palette, BotMessageSquare, Pipette } from "lucide-react";
import { useMoodboard, isImageUrl, uploadFile, type MbItem } from "./moodboard-logic";
import { AiChat } from "./ai-chat";

/* ─── Note color palette ───────────────────────────────────────── */

const NOTE_COLORS: { key: string; bg: string; border: string; text: string }[] = [
  { key: "yellow", bg: "#fef9c3", border: "#fde047", text: "#713f12" },
  { key: "pink",   bg: "#fce7f3", border: "#f9a8d4", text: "#831843" },
  { key: "blue",   bg: "#dbeafe", border: "#93c5fd", text: "#1e3a8a" },
  { key: "green",  bg: "#dcfce7", border: "#86efac", text: "#14532d" },
  { key: "purple", bg: "#ede9fe", border: "#c4b5fd", text: "#4c1d95" },
  { key: "peach",  bg: "#ffedd5", border: "#fdba74", text: "#7c2d12" },
];

function getNoteColor(key: string | null) {
  return NOTE_COLORS.find((c) => c.key === key) ?? NOTE_COLORS[0];
}

/* ─── helpers ─────────────────────────────────────────────────── */

function canvasPos(e: React.DragEvent | React.MouseEvent, ref: React.RefObject<HTMLDivElement>) {
  const rect = ref.current!.getBoundingClientRect();
  return {
    x: e.clientX - rect.left + ref.current!.scrollLeft,
    y: e.clientY - rect.top  + ref.current!.scrollTop,
  };
}

/* ─── Item card ────────────────────────────────────────────────── */

function ItemCard({
  item, onMove, onSavePos, onBringToFront, onDelete, onUpdate, canvasRef,
}: {
  item:           MbItem;
  onMove:         (id: string, x: number, y: number) => void;
  onSavePos:      (id: string, x: number, y: number) => void;
  onBringToFront: (id: string) => void;
  onDelete:       (id: string) => void;
  onUpdate:       (id: string, patch: { content?: string; label?: string | null }) => Promise<void>;
  canvasRef:      React.RefObject<HTMLDivElement>;
}) {
  const [editing,      setEditing]      = useState(false);
  const [draft,        setDraft]        = useState(item.content);
  const [caption,      setCaption]      = useState(item.label ?? "");
  const [imgErr,       setImgErr]       = useState(false);
  const [showColors,   setShowColors]   = useState(false);
  const dragging = useRef(false);

  const isNote  = item.type === "NOTE";
  const isColor = item.type === "COLOR";
  const noteCol = getNoteColor(isNote ? item.label : null);

  /* drag-to-move */
  function handleMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    e.preventDefault();
    e.stopPropagation();
    onBringToFront(item.id);
    dragging.current = true;

    const startMX = e.clientX;
    const startMY = e.clientY;
    const origX   = item.x;
    const origY   = item.y;

    function onMM(ev: MouseEvent) {
      onMove(item.id, origX + ev.clientX - startMX, origY + ev.clientY - startMY);
    }
    function onMU(ev: MouseEvent) {
      dragging.current = false;
      onSavePos(item.id, origX + ev.clientX - startMX, origY + ev.clientY - startMY);
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("mouseup",   onMU);
    }
    document.addEventListener("mousemove", onMM);
    document.addEventListener("mouseup",   onMU);
  }

  async function saveEdit() {
    await onUpdate(item.id, {
      content: isNote ? draft : item.content,
      label:   isNote ? item.label : (caption || null),
    });
    setEditing(false);
  }

  async function changeNoteColor(key: string) {
    setShowColors(false);
    await onUpdate(item.id, { label: key });
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ position: "absolute", left: item.x, top: item.y, width: item.width, zIndex: item.zIndex, cursor: "grab" }}
      className="group select-none"
    >
      {/* top action bar — visible on hover */}
      <div
        data-no-drag="1"
        className="absolute -top-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end"
      >
        {/* note color picker toggle */}
        {isNote && (
          <button
            onClick={() => setShowColors((v) => !v)}
            title="Change color"
            className="w-6 h-6 rounded-md flex items-center justify-center shadow"
            style={{ background: noteCol.bg, border: `1px solid ${noteCol.border}`, color: noteCol.text }}
          >
            <Palette size={10} />
          </button>
        )}

        {/* edit */}
        {!editing && (
          <button
            onClick={() => { setDraft(item.content); setCaption(item.label ?? ""); setEditing(true); }}
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow"
            style={{ background: "var(--c-accent)" }}
            title="Edit"
          >✎</button>
        )}

        {/* delete */}
        <button
          onClick={() => onDelete(item.id)}
          className="w-6 h-6 rounded-md flex items-center justify-center shadow"
          style={{ background: "var(--c-danger)", color: "#fff" }}
          title="Delete"
        >
          <X size={10} />
        </button>
      </div>

      {/* color swatch popover for notes */}
      {isNote && showColors && (
        <div
          data-no-drag="1"
          className="absolute -top-16 left-0 z-50 flex gap-1.5 p-2 rounded-xl shadow-xl"
          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
        >
          {NOTE_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => changeNoteColor(c.key)}
              title={c.key}
              className="w-5 h-5 rounded-full ring-2 ring-offset-1 transition-transform hover:scale-110"
              style={{
                background: c.bg,
                border: `2px solid ${c.border}`,
                outline: item.label === c.key ? `2px solid ${c.border}` : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      )}

      {/* card body */}
      {isNote ? (
        <div
          className="rounded-2xl p-4 shadow-lg min-h-[80px]"
          style={{ background: noteCol.bg, border: `1px solid ${noteCol.border}`, color: noteCol.text }}
        >
          {editing ? (
            <div data-no-drag="1" className="flex flex-col gap-2">
              <textarea
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed"
                rows={4}
                style={{ color: noteCol.text }}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="p-1 rounded opacity-60 hover:opacity-100"><X size={12} /></button>
                <button onClick={saveEdit} className="p-1 rounded" style={{ color: noteCol.text, opacity: 0.8 }}><Check size={12} /></button>
              </div>
            </div>
          ) : (
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              onDoubleClick={() => { setDraft(item.content); setEditing(true); }}
            >
              {item.content || <span className="opacity-40 italic">Double-click to edit…</span>}
            </p>
          )}
        </div>
      ) : isColor ? (
        /* ── Color swatch card ── */
        <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: "1px solid var(--c-border)" }}>
          <div style={{ background: item.content, height: 100 }} />
          <div style={{ background: "var(--c-elevated)", padding: "10px 12px" }}>
            {editing ? (
              <div data-no-drag="1" className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono flex-1" style={{ color: "var(--c-text)" }}>{draft}</span>
                </div>
                <input
                  autoFocus
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Color name…"
                  className="w-full text-xs bg-transparent outline-none border-b pb-1"
                  style={{ color: "var(--c-text)", borderColor: "var(--c-border)" }}
                  onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
                />
                <div className="flex gap-1 justify-end">
                  <button onClick={() => setEditing(false)} style={{ color: "var(--c-text-faint)" }}><X size={12} /></button>
                  <button onClick={saveEdit} style={{ color: "var(--c-accent-text)" }}><Check size={12} /></button>
                </div>
              </div>
            ) : (
              <div onDoubleClick={() => { setDraft(item.content); setCaption(item.label ?? ""); setEditing(true); }}>
                <p className="text-xs font-mono font-medium" style={{ color: "var(--c-text)" }}>{item.content.toUpperCase()}</p>
                {item.label && <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-muted)" }}>{item.label}</p>}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Image card ── */
        <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}>
          {imgErr ? (
            <div className="flex items-center justify-center h-32 text-xs" style={{ color: "var(--c-text-faint)" }}>
              Could not load image
            </div>
          ) : (
            <img
              src={item.content}
              alt={item.label ?? ""}
              className="w-full block object-cover"
              draggable={false}
              onError={() => setImgErr(true)}
            />
          )}
          {editing ? (
            <div data-no-drag="1" className="p-2 flex gap-1">
              <input
                autoFocus
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add caption…"
                className="flex-1 text-xs bg-transparent outline-none"
                style={{ color: "var(--c-text)" }}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
              />
              <button onClick={saveEdit} style={{ color: "var(--c-accent-text)" }}><Check size={12} /></button>
              <button onClick={() => setEditing(false)} style={{ color: "var(--c-text-faint)" }}><X size={12} /></button>
            </div>
          ) : item.label ? (
            <p className="text-xs px-3 py-2" style={{ color: "var(--c-text-muted)" }}>{item.label}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ─── Main board ───────────────────────────────────────────────── */

const COLOR_PRESETS = [
  "#7c3aed","#2563eb","#0891b2","#16a34a",
  "#ca8a04","#ea580c","#dc2626","#db2777",
  "#475569","#1c1917","#f8fafc","#e2e8f0",
];

export function MoodboardClient({ clientId, initialItems }: { clientId: string; initialItems: MbItem[] }) {
  const canvasRef       = useRef<HTMLDivElement>(null);
  const colorPickerRef  = useRef<HTMLDivElement>(null);
  const [dragOver,      setDragOver]      = useState(false);
  const [loading,       setLoading]       = useState<string | null>(null);
  const [showChat,      setShowChat]      = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor,   setPickerColor]   = useState("#7c3aed");
  const [pickerName,    setPickerName]    = useState("");

  // Close color picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { items, addItem, updateItem, moveItem, savePosition, bringToFront, deleteItem } =
    useMoodboard(clientId, initialItems);

  /* drop */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const { x, y } = canvasPos(e, canvasRef);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) {
      for (const file of files) {
        setLoading("Uploading…");
        const url = await uploadFile(file);
        setLoading(null);
        await addItem("IMAGE", url, null, x + Math.random() * 20, y + Math.random() * 20);
      }
      return;
    }

    const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (uri) {
      if (isImageUrl(uri)) await addItem("IMAGE", uri.trim(), null, x, y);
      else                  await addItem("NOTE",  uri.trim(), null, x, y);
    }
  }, [addItem]);

  /* paste */
  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      const imgItem = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith("image/"));
      if (imgItem) {
        const file = imgItem.getAsFile();
        if (file) {
          setLoading("Uploading…");
          const url = await uploadFile(file);
          setLoading(null);
          const cx = (canvasRef.current?.scrollLeft ?? 0) + 200 + Math.random() * 100;
          const cy = (canvasRef.current?.scrollTop  ?? 0) + 200 + Math.random() * 100;
          await addItem("IMAGE", url, null, cx, cy);
          return;
        }
      }
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;
      const cx = (canvasRef.current?.scrollLeft ?? 0) + 200 + Math.random() * 100;
      const cy = (canvasRef.current?.scrollTop  ?? 0) + 200 + Math.random() * 100;
      if (isImageUrl(text)) await addItem("IMAGE", text, null, cx, cy);
      else                   await addItem("NOTE",  text, null, cx, cy);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addItem]);

  async function addNote() {
    const cx = (canvasRef.current?.scrollLeft ?? 0) + 120 + Math.random() * 200;
    const cy = (canvasRef.current?.scrollTop  ?? 0) + 120 + Math.random() * 200;
    await addItem("NOTE", "", "yellow", cx, cy);
  }

  async function addColor() {
    const cx = (canvasRef.current?.scrollLeft ?? 0) + 120 + Math.random() * 200;
    const cy = (canvasRef.current?.scrollTop  ?? 0) + 120 + Math.random() * 200;
    await addItem("COLOR", pickerColor, pickerName.trim() || null, cx, cy);
    setShowColorPicker(false);
    setPickerName("");
  }

  return (
    <div className="flex flex-1 overflow-hidden">
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* toolbar */}
      <div
        className="flex items-center gap-3 px-6 py-3 flex-shrink-0 text-xs"
        style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-bg)" }}
      >
        <button
          onClick={addNote}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{ background: "var(--c-elevated)", color: "var(--c-text)", border: "1px solid var(--c-border)" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--c-accent)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--c-border)")}
        >
          <StickyNote size={13} />
          Add Note
        </button>

        {/* Color picker button + popover */}
        <div ref={colorPickerRef} className="relative">
          <button
            onClick={() => setShowColorPicker(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{ background: "var(--c-elevated)", color: "var(--c-text)", border: "1px solid var(--c-border)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--c-accent)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--c-border)")}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: pickerColor }} />
            Add Color
          </button>

          {showColorPicker && (
            <div
              className="absolute top-full left-0 mt-2 z-50 p-4 rounded-2xl shadow-xl flex flex-col gap-3"
              style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", minWidth: 220 }}
            >
              {/* Color input */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={pickerColor}
                  onChange={e => setPickerColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0.5"
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <p className="text-xs font-mono font-semibold" style={{ color: "var(--c-text)" }}>
                    {pickerColor.toUpperCase()}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>Click swatch to pick</p>
                </div>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-6 gap-1.5">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => setPickerColor(c)}
                    title={c}
                    className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                    style={{
                      background: c,
                      border: c === pickerColor ? "2px solid var(--c-accent)" : "2px solid transparent",
                      outline: c === pickerColor ? "2px solid var(--c-accent)" : "none",
                      outlineOffset: "1px",
                    }}
                  />
                ))}
              </div>

              {/* Name input */}
              <input
                value={pickerName}
                onChange={e => setPickerName(e.target.value)}
                placeholder="Color name (optional)"
                className="w-full text-xs px-3 py-2 rounded-lg bg-transparent outline-none"
                style={{ color: "var(--c-text)", border: "1px solid var(--c-border)" }}
                onKeyDown={e => e.key === "Enter" && addColor()}
              />

              <button
                onClick={addColor}
                className="w-full py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: pickerColor }}
              >
                Add to Board
              </button>
            </div>
          )}
        </div>

        <span style={{ color: "var(--c-text-faint)" }}>·</span>
        <span style={{ color: "var(--c-text-faint)" }}>
          <ImagePlus size={12} className="inline mr-1.5 mb-0.5" />
          Drop images here · Paste a URL or screenshot · Drag from Pinterest
        </span>
        <button
          onClick={() => setShowChat(v => !v)}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all"
          style={{
            background:  showChat ? "var(--c-accent)" : "var(--c-elevated)",
            color:       showChat ? "#fff" : "var(--c-text)",
            border:      `1px solid ${showChat ? "var(--c-accent)" : "var(--c-border)"}`,
          }}
        >
          <BotMessageSquare size={13} />
          AI Assistant
        </button>
        {loading && (
          <span className="flex items-center gap-1.5" style={{ color: "var(--c-accent-text)" }}>
            <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {loading}
          </span>
        )}
      </div>

      {/* canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto relative"
        style={{
          background:      "var(--c-bg)",
          backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--c-text) 12%, transparent) 1px, transparent 1px)",
          backgroundSize:  "28px 28px",
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* drop overlay */}
        {dragOver && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ background: "rgba(124,58,237,0.08)", border: "2px dashed var(--c-accent)" }}
          >
            <p className="text-lg font-semibold" style={{ color: "var(--c-accent-text)" }}>Drop to add to board</p>
          </div>
        )}

        {/* inner canvas */}
        <div style={{ width: 4000, height: 3000, position: "relative" }}>
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onMove={moveItem}
              onSavePos={savePosition}
              onBringToFront={bringToFront}

              onDelete={deleteItem}
              onUpdate={updateItem}
              canvasRef={canvasRef}
            />
          ))}

          {items.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
              style={{ color: "var(--c-text-faint)" }}
            >
              <ImagePlus size={40} className="opacity-20" />
              <p className="text-sm opacity-40">Drop images · Paste URLs · Add notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
    {showChat && <AiChat onClose={() => setShowChat(false)} moodboardItems={items} clientId={clientId} />}
    </div>
  );
}
