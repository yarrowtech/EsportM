import { getDemoPersona, switchDemoPersona } from "./persona";

export default function DemoBanner() {
  const persona = getDemoPersona();
  const next = persona === "player" ? "admin" : "player";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 14,
        left: 14,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 6px 6px 14px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
        color: "#fff",
        background: "rgba(15, 23, 42, 0.88)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: "#34d399", display: "inline-block" }} />
      <span>
        Live demo<span className="hidden sm:inline"> — sample data only</span>
      </span>
      <button
        type="button"
        onClick={() => switchDemoPersona(next)}
        title={`You are viewing the demo as ${persona === "player" ? "a player" : "the club admin"}`}
        style={{
          pointerEvents: "auto",
          cursor: "pointer",
          border: 0,
          borderRadius: 999,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 700,
          color: "#0f172a",
          background: "#fff",
        }}
      >
        View as {next === "player" ? "Player" : "Admin"}
      </button>
    </div>
  );
}
