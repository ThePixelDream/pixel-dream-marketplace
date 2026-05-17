// web/app/signup/page.tsx

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fce4f0",
      fontFamily: "Inter, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "40px 32px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4, color: "#111" }}>
          Create account
        </h1>
        <p style={{ fontSize: 14, color: "#6e6e78", marginBottom: 28 }}>
          Join The Pixel Dream
        </p>

        {searchParams.error && (
          <div style={{
            background: "#fee2e2", color: "#dc2626",
            borderRadius: 10, padding: "12px 14px",
            fontSize: 13, fontWeight: 600, marginBottom: 20,
          }}>
            {searchParams.error}
          </div>
        )}

        <form action="/auth/signup" method="post" style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{
                height: 44, padding: "0 14px", borderRadius: 10,
                border: "1px solid #e8e8ed", fontSize: 14, width: "100%",
                fontFamily: "inherit",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              style={{
                height: 44, padding: "0 14px", borderRadius: 10,
                border: "1px solid #e8e8ed", fontSize: 14, width: "100%",
                fontFamily: "inherit",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
              Referral code <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span>
            </span>
            <input
              name="referral_code"
              type="text"
              autoComplete="off"
              style={{
                height: 44, padding: "0 14px", borderRadius: 10,
                border: "1px solid #e8e8ed", fontSize: 14, width: "100%",
                fontFamily: "inherit",
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              height: 48, borderRadius: 999, border: "none",
              background: "#e91e8c", color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", marginTop: 4,
            }}
          >
            Create account
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "#6e6e78", marginTop: 20 }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#e91e8c", fontWeight: 600 }}>Log in</a>
        </p>
      </div>
    </div>
  );
}
