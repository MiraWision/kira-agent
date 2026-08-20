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
        {/* The mark, inlined as a data URI: Satori renders <img> reliably where
            hand-written SVG children are hit or miss. */}
        <img width={44} height={44} src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI1IDBIN0MzLjEzNDAxIDAgMCAzLjEzNDAxIDAgN1YyNUMwIDI4Ljg2NiAzLjEzNDAxIDMyIDcgMzJIMjVDMjguODY2IDMyIDMyIDI4Ljg2NiAzMiAyNVY3QzMyIDMuMTM0MDEgMjguODY2IDAgMjUgMFoiIGZpbGw9IiNEOTc3NTciLz4KPHBhdGggZD0iTTIxLjUgMTUuMjVDMjEuOTE0MiAxNS4yNSAyMi4yNSAxNS41ODU4IDIyLjI1IDE2QzIyLjI1IDE2LjQxNDIgMjEuOTE0MiAxNi43NSAyMS41IDE2Ljc1SDEyLjVDMTIuMDg1OCAxNi43NSAxMS43NSAxNi40MTQyIDExLjc1IDE2QzExLjc1IDE1LjU4NTggMTIuMDg1OCAxNS4yNSAxMi41IDE1LjI1SDIxLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEuMzE2NCA5LjE5MjM4QzExLjQ4NjQgOC44MTQ2NSAxMS45Mjk5IDguNjQ2NDMgMTIuMzA3NiA4LjgxNjQxTDIyLjMwNzYgMTMuMzE2NEMyMi42ODUzIDEzLjQ4NjQgMjIuODUzNiAxMy45Mjk5IDIyLjY4MzYgMTQuMzA3NkMyMi41MTM2IDE0LjY4NTMgMjIuMDcwMSAxNC44NTM2IDIxLjY5MjQgMTQuNjgzNkwxMS42OTI0IDEwLjE4MzZDMTEuMzE0NyAxMC4wMTM2IDExLjE0NjQgOS41NzAxMSAxMS4zMTY0IDkuMTkyMzhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEuMzE2NCAyMi44MDc2QzExLjQ4NjQgMjMuMTg1MyAxMS45Mjk5IDIzLjM1MzYgMTIuMzA3NiAyMy4xODM2TDIyLjMwNzYgMTguNjgzNkMyMi42ODUzIDE4LjUxMzYgMjIuODUzNiAxOC4wNzAxIDIyLjY4MzYgMTcuNjkyNEMyMi41MTM2IDE3LjMxNDcgMjIuMDcwMSAxNy4xNDY0IDIxLjY5MjQgMTcuMzE2NEwxMS42OTI0IDIxLjgxNjRDMTEuMzE0NyAyMS45ODY0IDExLjE0NjQgMjIuNDI5OSAxMS4zMTY0IDIyLjgwNzZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEuMTUwNCA5QzExLjE1MDQgOC4zNjQ4NyAxMC42MzUxIDcuODQ5NjEgMTAgNy44NDk2MUM5LjM2NDg3IDcuODQ5NjEgOC44NDk2MSA4LjM2NDg3IDguODQ5NjEgOUM4Ljg0OTYxIDkuNjM1MTMgOS4zNjQ4NyAxMC4xNTA0IDEwIDEwLjE1MDRDMTAuNjM1MSAxMC4xNTA0IDExLjE1MDQgOS42MzUxMyAxMS4xNTA0IDlaTTEyLjg0OTYgOUMxMi44NDk2IDEwLjU3NCAxMS41NzQgMTEuODQ5NiAxMCAxMS44NDk2QzguNDI1OTkgMTEuODQ5NiA3LjE1MDM5IDEwLjU3NCA3LjE1MDM5IDlDNy4xNTAzOSA3LjQyNTk5IDguNDI1OTkgNi4xNTAzOSAxMCA2LjE1MDM5QzExLjU3NCA2LjE1MDM5IDEyLjg0OTYgNy40MjU5OSAxMi44NDk2IDlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEuMjUgMTZDMTEuMjUgMTUuMzA5NiAxMC42OTA0IDE0Ljc1IDEwIDE0Ljc1QzkuMzA5NjQgMTQuNzUgOC43NSAxNS4zMDk2IDguNzUgMTZDOC43NSAxNi42OTA0IDkuMzA5NjQgMTcuMjUgMTAgMTcuMjVDMTAuNjkwNCAxNy4yNSAxMS4yNSAxNi42OTA0IDExLjI1IDE2Wk0xMi43NSAxNkMxMi43NSAxNy41MTg4IDExLjUxODggMTguNzUgMTAgMTguNzVDOC40ODEyMiAxOC43NSA3LjI1IDE3LjUxODggNy4yNSAxNkM3LjI1IDE0LjQ4MTIgOC40ODEyMiAxMy4yNSAxMCAxMy4yNUMxMS41MTg4IDEzLjI1IDEyLjc1IDE0LjQ4MTIgMTIuNzUgMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEuMTUwNCAyM0MxMS4xNTA0IDIyLjM2NDkgMTAuNjM1MSAyMS44NDk2IDEwIDIxLjg0OTZDOS4zNjQ4NyAyMS44NDk2IDguODQ5NjEgMjIuMzY0OSA4Ljg0OTYxIDIzQzguODQ5NjEgMjMuNjM1MSA5LjM2NDg3IDI0LjE1MDQgMTAgMjQuMTUwNEMxMC42MzUxIDI0LjE1MDQgMTEuMTUwNCAyMy42MzUxIDExLjE1MDQgMjNaTTEyLjg0OTYgMjNDMTIuODQ5NiAyNC41NzQgMTEuNTc0IDI1Ljg0OTYgMTAgMjUuODQ5NkM4LjQyNTk5IDI1Ljg0OTYgNy4xNTAzOSAyNC41NzQgNy4xNTAzOSAyM0M3LjE1MDM5IDIxLjQyNiA4LjQyNTk5IDIwLjE1MDQgMTAgMjAuMTUwNEMxMS41NzQgMjAuMTUwNCAxMi44NDk2IDIxLjQyNiAxMi44NDk2IDIzWiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIxNiIgcj0iMyIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==" />
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
