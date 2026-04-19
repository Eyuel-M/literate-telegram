"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Trash2, GripHorizontal, StickyNote, ImagePlus, X, Check } from "lucide-react";
import { useMoodboard, isImageUrl, uploadFile, type MbItem } from "./moodboard-logic";

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
  item: MbItem;
  onMove:         (id: string, x: number, y: number) => void;
  onSavePos:      (id: string, x: number, y: number) => void;
  onBringToFront: (id: string) => void;
  onDelete:       (id: string) => void;
  onUpdate:       (id: string, patch: { content?: string; label?: string | null }) => Promise<void>;
  canvasRef:      React.RefObject<HTMLDivElement>;
}) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(item.content);
  const [caption, setCaption]   = useState(item.label ?? "");
  const [imgErr,  setImgErr]    = useState(false);
  const dragging                = useRef(false);

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
      const nx = origX + ev.clientX - startMX;
      const ny = origY + ev.clientY - startMY;
      onSavePos(item.id, nx, ny);
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("mouseup",   onMU);
    }
    document.addEventListener("mousemove", onMM);
    document.addEventListener("mouseup",   onMU);
  }

  /* save edits */
  async function saveEdit() {
    await onUpdate(item.id, {
      content: item.type === "NOTE" ? draft : item.content,
      label:   item.type === "IMAGE" ? caption || null : item.label,
    });
    setEditing(false);
  }

  const isNote = item.type === "NOTE";

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left:     item.x,
        top:      item.y,
        width:    item.width,
        zIndex:   item.zIndex,
        cursor:   "grab",
      }}
      className="group select-none"
    >
      {/* drag grip */}
      <div
        className="absolute -top-6 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2"
        style={{ color: "var(--c-text-faint)" }}
      >
        <GripHorizontal size={14} />
      </div>

      {/* action buttons */}
      <div
        data-no-drag="1"
        className="absolute -top-3 -right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
      >
        {!editing && (
          <button
            onClick={() => { setDraft(item.content); setCaption(item.label ?? ""); setEditing(true); }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow"
            style={{ background: "var(--c-accent)" }}
            title="Edit"
          >✎</button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="w-6 h-6 rounded-full flex items-center justify-center shadow"
          style={{ background: "var(--c-danger)", color: "#fff" }}
          title="Delete"
        >
          <X size={11} />
        </button>
      </div>

      {/* card body */}
      {isNote ? (
        <div
          className="rounded-2xl p-4 shadow-lg min-h-[80px]"
          style={{ background: "#fef9c3", border: "1px solid #fde047", color: "#713f12" }}
        >
          {editing ? (
            <div data-no-drag="1" className="flex flex-col gap-2">
              <textarea
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed"
                rows={4}
                style={{ color: "#713f12" }}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="p-1 rounded opacity-60 hover:opacity-100"><X size={12} /></button>
                <button onClick={saveEdit} className="p-1 rounded" style={{ color: "var(--c-accent)" }}><Check size={12} /></button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap" onDoubleClick={() => { setDraft(item.content); setEditing(true); }}>
              {item.content || <span className="opacity-40 italic">Double-click to edit…</span>}
            </p>
          )}
        </div>
      ) : (
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

export function MoodboardClient({ clientId, initialItems }: { clientId: string; initialItems: MbItem[] }) {
  const canvasRef  = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading,  setLoading]  = useState<string | null>(null);

  const { items, addItem, updateItem, moveItem, savePosition, bringToFront, deleteItem } =
    useMoodboard(clientId, initialItems);

  /* ── drop handler ── */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const { x, y } = canvasPos(e, canvasRef);

    /* files dragged from desktop */
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

    /* URL dragged from browser (e.g. Pinterest image) */
    const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (uri) {
      if (isImageUrl(uri)) {
        await addItem("IMAGE", uri.trim(), null, x, y);
      } else {
        await addItem("NOTE", uri.trim(), null, x, y);
      }
    }
  }, [addItem]);

  /* ── paste handler ── */
  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      /* pasted image file (screenshot, copy from browser) */
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

      /* pasted text — URL or note */
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;
      const cx = (canvasRef.current?.scrollLeft ?? 0) + 200 + Math.random() * 100;
      const cy = (canvasRef.current?.scrollTop  ?? 0) + 200 + Math.random() * 100;
      if (isImageUrl(text)) {
        await addItem("IMAGE", text, null, cx, cy);
      } else {
        await addItem("NOTE", text, null, cx, cy);
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addItem]);

  /* ── add blank note ── */
  async function addNote() {
    const cx = (canvasRef.current?.scrollLeft ?? 0) + 120 + Math.random() * 200;
    const cy = (canvasRef.current?.scrollTop  ?? 0) + 120 + Math.random() * 200;
    await addItem("NOTE", "", null, cx, cy);
  }

  return (
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
        <span style={{ color: "var(--c-text-faint)" }}>·</span>
        <span style={{ color: "var(--c-text-faint)" }}>
          <ImagePlus size={12} className="inline mr-1.5 mb-0.5" />
          Drop images here · Paste a URL or screenshot · Drag from Pinterest
        </span>
        {loading && (
          <span className="ml-auto flex items-center gap-1.5" style={{ color: "var(--c-accent-text)" }}>
            <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {loading}
          </span>
        )}
      </div>

      {/* canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto relative"
        style={{ background: "var(--c-bg)" }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* drop overlay */}
        {dragOver && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ background: "rgba(124,58,237,0.08)", border: "2px dashed var(--c-accent)", borderRadius: 0 }}
          >
            <p className="text-lg font-semibold" style={{ color: "var(--c-accent-text)" }}>Drop to add to board</p>
          </div>
        )}

        {/* inner canvas — large enough to work in */}
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

          {/* empty state */}
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
  );
}
