import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/marketplace");

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Login</h1>
      <p style={{ color: "#6e6e78", marginBottom: 18 }}>
        Entre para comprar e acessar seus produtos.
      </p>

      <form action="/auth/login" method="post" style={{ display: "grid", gap: 12 }}>
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
            autoComplete="current-password"
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
          Entrar
        </button>

        <p style={{ color: "#6e6e78" }}>
          Não tem conta? <a href="/signup">Criar conta</a>
        </p>
      </form>
    </main>
  );
}

