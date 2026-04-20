"use client";

import { useState, useCallback, useRef } from "react";

/* ─── Types ──────────────────────────────────────────────────── */

export type ItemType = "IMAGE" | "NOTE" | "COLOR";

export interface MbItem {
  id:        string;
  type:      ItemType;
  content:   string;   // image URL  or  note text
  label:     string | null;
  x:         number;
  y:         number;
  width:     number;
  zIndex:    number;
  createdAt: string;
  updatedAt: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */

export function isImageUrl(text: string): boolean {
  const lower = text.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff)(\?.*)?$/.test(lower)) return true;
  if (lower.includes("i.pinimg.com"))  return true;
  if (lower.includes("images.unsplash")) return true;
  if (lower.includes("cdn.shopify"))   return true;
  if (lower.includes("/image/"))       return true;
  if (lower.includes("imagedelivery")) return true;
  return false;
}

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  return json.url as string;
}

/* ─── Hook ───────────────────────────────────────────────────── */

export function useMoodboard(clientId: string, initial: MbItem[]) {
  const [items, setItems]         = useState<MbItem[]>(initial);
  const [topZ,  setTopZ]          = useState(() => Math.max(0, ...initial.map((i) => i.zIndex)));
  const itemsRef                  = useRef<MbItem[]>(items);
  itemsRef.current                = items;

  /* add --------------------------------------------------------- */
  const addItem = useCallback(
    async (type: ItemType, content: string, label: string | null, x: number, y: number) => {
      const res = await fetch(`/api/clients/${clientId}/moodboard`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, content, label,
          x, y,
          width: type === "NOTE" ? 260 : 320,
        }),
      });
      const item: MbItem = await res.json();
      setItems((p) => [...p, item]);
      setTopZ(item.zIndex);
      return item;
    },
    [clientId],
  );

  /* update (content / label) ------------------------------------ */
  const updateItem = useCallback(
    async (id: string, patch: { content?: string; label?: string | null }) => {
      setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      await fetch(`/api/clients/${clientId}/moodboard/items/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(patch),
      });
    },
    [clientId],
  );

  /* move (optimistic, no server call until drop) ---------------- */
  const moveItem = useCallback((id: string, x: number, y: number) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, x, y } : i)));
  }, []);

  /* save position after drag ends ------------------------------- */
  const savePosition = useCallback(
    (id: string, x: number, y: number) => {
      fetch(`/api/clients/${clientId}/moodboard/items/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ x, y }),
      });
    },
    [clientId],
  );

  /* resize ------------------------------------------------------ */
  const saveWidth = useCallback(
    (id: string, width: number) => {
      setItems((p) => p.map((i) => (i.id === id ? { ...i, width } : i)));
      fetch(`/api/clients/${clientId}/moodboard/items/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ width }),
      });
    },
    [clientId],
  );

  /* bring to front ---------------------------------------------- */
  const bringToFront = useCallback(
    (id: string) => {
      setTopZ((z) => {
        const nz = z + 1;
        setItems((p) => p.map((i) => (i.id === id ? { ...i, zIndex: nz } : i)));
        fetch(`/api/clients/${clientId}/moodboard/items/${id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ zIndex: nz }),
        });
        return nz;
      });
    },
    [clientId],
  );

  /* send to back --------------------------------------------- */
  const sendToBack = useCallback(
    (id: string) => {
      setItems((p) => {
        const minZ = Math.min(0, ...p.map((i) => i.zIndex));
        const nz   = minZ - 1;
        fetch(`/api/clients/${clientId}/moodboard/items/${id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ zIndex: nz }),
        });
        return p.map((i) => (i.id === id ? { ...i, zIndex: nz } : i));
      });
    },
    [clientId],
  );

  /* delete ------------------------------------------------------ */
  const deleteItem = useCallback(
    async (id: string) => {
      setItems((p) => p.filter((i) => i.id !== id));
      await fetch(`/api/clients/${clientId}/moodboard/items/${id}`, { method: "DELETE" });
    },
    [clientId],
  );

  return {
    items,
    itemsRef,
    addItem,
    updateItem,
    moveItem,
    savePosition,
    saveWidth,
    bringToFront,
    sendToBack,
    deleteItem,
  };
}
