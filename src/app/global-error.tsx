"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#1B1033", color: "#fff", fontFamily: "Georgia, serif", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 40, margin: 0 }}>We'll be right back.</h1>
          <p style={{ opacity: 0.7, fontFamily: "system-ui, sans-serif" }}>Lit Concierge is briefly unavailable. Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 999, border: 0, background: "linear-gradient(120deg,#E23E7D,#F7931E)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
