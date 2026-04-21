"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { SettingsClient } from "./settings-client";

interface Props {
  open:         boolean;
  onClose:      () => void;
  sidebarWidth: number;
}

export function SettingsDrawer({ open, onClose, sidebarWidth }: Props) {
  const { data: session } = useSession();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const user = session?.user as { id: string; name: string; email: string; role: string } | undefined;
  if (!user) return null;

  return (
    <>
      {/* Backdrop — click to close, covers only the main content area */}
      <div
        onClick={onClose}
        style={{
          position:   "fixed",
          inset:      0,
          left:       sidebarWidth,
          zIndex:     40,
          background: "rgba(0,0,0,0.45)",
          opacity:    open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.22s ease",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position:   "fixed",
          top:        0,
          bottom:     0,
          left:       sidebarWidth,
          width:      460,
          zIndex:     41,
          background: "var(--c-bg)",
          borderRight: "1px solid var(--c-border)",
          boxShadow:  "4px 0 24px rgba(0,0,0,0.25)",
          transform:  open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          display:    "flex",
          flexDirection: "column",
          overflowY:  "hidden",
        }}
      >
        <SettingsClient user={user} onClose={onClose} />
      </div>
    </>
  );
}
