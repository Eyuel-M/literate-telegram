"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { SettingsClient } from "./settings-client";

interface Props {
  open:         boolean;
  onClose:      () => void;
  sidebarWidth: number;
}

export function SettingsDrawer({ open, onClose, sidebarWidth }: Props) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // Wait for client mount before portalling (avoids SSR mismatch)
  useEffect(() => { setMounted(true); }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const user = session?.user as { id: string; name: string; email: string; role: string } | undefined;

  if (!mounted || !user) return null;

  return createPortal(
    <>
      {/* Backdrop — only covers main content, not the sidebar */}
      <div
        onClick={onClose}
        style={{
          position:      "fixed",
          inset:         0,
          left:          sidebarWidth + 460, // to the right of the drawer panel
          zIndex:        50,
          background:    "rgba(0,0,0,0.45)",
          opacity:       open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition:    "opacity 0.22s ease",
        }}
      />

      {/* Drawer panel — slides in right next to the sidebar */}
      <div
        style={{
          position:      "fixed",
          top:           0,
          bottom:        0,
          left:          sidebarWidth,
          width:         460,
          zIndex:        50,
          background:    "var(--c-bg)",
          borderRight:   "1px solid var(--c-border)",
          boxShadow:     "6px 0 32px rgba(0,0,0,0.22)",
          transform:     open ? "translateX(0)" : "translateX(-100%)",
          transition:    "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
        }}
      >
        <SettingsClient user={user} onClose={onClose} />
      </div>
    </>,
    document.body
  );
}
