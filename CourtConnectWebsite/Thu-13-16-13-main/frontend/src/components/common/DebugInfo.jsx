// src/components/common/DebugInfo.jsx
import React from "react";

export default function DebugInfo() {
  // read environment now
  const isMock = import.meta.env.VITE_USE_MOCK === "true" || import.meta.env.VITE_USE_MOCK === "1";
  const bypassAuth = import.meta.env.VITE_DEV_BYPASS_AUTH === "1";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "(none)";

  // only show when developing
  if (import.meta.env.PROD) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        fontSize: "12px",
        padding: "8px 12px",
        borderRadius: "8px",
        zIndex: 9999,
      }}
    >
      <div>🧩 <b>Debug Info</b></div>
      <div>Mode: {isMock ? "🟢 Mock" : "🔵 API"}</div>
      <div>Auth Bypass: {bypassAuth ? "✅ On" : "❌ Off"}</div>
      <div>API Base: {apiBase}</div>
    </div>
  );
}
