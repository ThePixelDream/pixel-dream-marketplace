import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceCents = Number(formData.get("price_cents") || 0);
  const currency = String(formData.get("currency") || "usd").trim().toLowerCase();
  const coverImageUrl = String(formData.get("cover_image_url") || "").trim();
  const active = formData.get("active") === "on";

  if (!title) {
    return NextResponse.redirect(new URL("/admin?error=missing_title", request.url), 303);
  }

  const { error } = await supabase.from("products").insert({
    title,
    description,
    price_cents: Number.isFinite(priceCents) ? Math.max(0, Math.trunc(priceCents)) : 0,
    currency: currency || "usd",
    cover_image_url: coverImageUrl || null,
    active,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent(error.message)}`, request.url),
      303
    );
  }

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}

