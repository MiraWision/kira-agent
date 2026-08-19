import { ImageResponse } from "next/og";

// Static export: the image is rendered once at build time, not per request.
export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "KIRA — a knowledge base about your product, extracted from your code";

/**
 * Satori requires an explicit `display` on any element with more than one
 * child, so every line here is its own flex row with a single text node.
 */
const line = (text: string, color: string) => (
  <div style={{ display: "flex", fontSize: 58, lineHeight: 1.2, letterSpacing: -1.5, color }}>
    {text}
  </div>
);

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0E1416",
        color: "#E6EDEE",
        padding: "72px 80px",
        fontFamily: "monospace",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", width: 44, height: 44, borderRadius: 10, background: "#D97757" }} />
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 3 }}>KIRA</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {line("Your help center goes stale", "#E6EDEE")}
        {line("the day you ship.", "#E6EDEE")}
        {line("KIRA reads your code instead.", "#D97757")}
      </div>

      <div style={{ display: "flex", fontSize: 26, color: "#8FA1A5" }}>
        Knowledge Interface for Reliable Answers · MIT
      </div>
    </div>,
    size,
  );
}
