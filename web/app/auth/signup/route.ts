import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeReferralCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const referralRaw = String(formData.get("referral_code") || "");
  const referralCode = referralRaw ? normalizeReferralCode(referralRaw) : "";

  const supabase = await createSupabaseServerClient();

  // If we have a referral code, validate it against `affiliates.code` (will be created in schema.sql).
  if (referralCode) {
    const { data: affiliate, error: affErr } = await supabase
      .from("affiliates")
      .select("code,status")
      .eq("code", referralCode)
      .maybeSingle();

    // If table doesn't exist yet, this query will error; allow signup but keep code for later.
    if (!affErr && (!affiliate || affiliate.status !== "active")) {
      return NextResponse.redirect(
        new URL(`/signup?error=${encodeURIComponent("Código de indicação inválido.")}`, request.url),
        303
      );
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: referralCode ? { referred_by_code: referralCode } : undefined,
    },
  });

  if (error) {
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(error.message)}`, request.url), 303);
  }

  // If email confirmations are disabled, user may already be logged in.
  if (data.user) {
    return NextResponse.redirect(new URL("/marketplace", request.url), 303);
  }

  return NextResponse.redirect(new URL("/login", request.url), 303);
}

