import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/marketplace");

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Criar conta</h1>
      <p style={{ color: "#6e6e78", marginBottom: 18 }}>
        Para comprar, você precisa criar uma conta. Se você tiver um código de indicação, coloque
        aqui.
      </p>

      <form action="/auth/signup" method="post" style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #e8e8ed" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Senha</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #e8e8ed" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Código de indicação (opcional)</span>
          <input
            name="referral_code"
            type="text"
            placeholder="Ex: PIXEL123"
            style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #e8e8ed" }}
          />
        </label>

        <button
          type="submit"
          style={{
            height: 44,
            borderRadius: 999,
            border: "none",
            background: "#111114",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Criar conta
        </button>

        <p style={{ color: "#6e6e78" }}>
          Já tem conta? <a href="/login">Entrar</a>
        </p>
      </form>
    </main>
  );
}

