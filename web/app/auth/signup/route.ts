// web/app/auth/signup/route.ts

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const referralRaw = String(formData.get("referral_code") || "");
  const referralCode = referralRaw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent("Email e senha são obrigatórios.")}`, request.url),
      303
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: referralCode ? { referred_by_code: referralCode } : undefined,
    },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent(error.message)}`, request.url),
      303
    );
  }

  if (data.user) {
    return NextResponse.redirect(new URL("/marketplace", request.url), 303);
  }

  return NextResponse.redirect(new URL("/login", request.url), 303);
}
