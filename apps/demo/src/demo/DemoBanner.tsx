export default function DemoBanner() {
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
        padding: "8px 14px",
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
      Live demo — sample data only
    </div>
  );
}
