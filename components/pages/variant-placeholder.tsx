/* Shared placeholder shell for A/B test variants that haven't been built yet. */

export function VariantPlaceholder({ variant }: { variant: string }) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "48px 24px",
        textAlign: "center",
        background: "linear-gradient(160deg, #2E7FD6 0%, #1FA7B8 60%, #16B981 120%)",
        color: "#fff",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <div
          style={{
            display: "inline-block",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          My Points Butler
        </div>
        <h1
          style={{
            fontFamily: "var(--font-head), system-ui, sans-serif",
            fontSize: "clamp(32px, 6vw, 56px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            margin: "16px 0 0",
          }}
        >
          Variant {variant.toUpperCase()}
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5, opacity: 0.92, marginTop: 16 }}>
          This A/B test variant is a placeholder. Try{" "}
          <a href="?variant=a" style={{ color: "#FFE27A", fontWeight: 700 }}>
            ?variant=a
          </a>{" "}
          for the full experience.
        </p>
      </div>
    </main>
  );
}
