import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.redirect(new URL("/login", request.url), 303);

  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
  if (!apiKey) {
    return NextResponse.redirect(
      new URL(`/checkout?error=${encodeURIComponent("COINBASE_COMMERCE_API_KEY not set")}`, request.url),
      303
    );
  }

  const formData = await request.formData();
  const productId = String(formData.get("product_id") || "");
  if (!productId) return NextResponse.redirect(new URL("/marketplace", request.url), 303);

  const { data: product } = await supabase
    .from("products")
    .select("id,title,price_cents,currency,active")
    .eq("id", productId)
    .maybeSingle();

  if (!product || !product.active) return NextResponse.redirect(new URL("/marketplace", request.url), 303);

  const { data: profile } = await supabase
    .from("profiles")
    .select("referred_by_code")
    .eq("id", userData.user.id)
    .maybeSingle();

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  // Coinbase Commerce wants price in decimal string (e.g. "9.99")
  const amount = (product.price_cents / 100).toFixed(2);

  const resp = await fetch("https://api.commerce.coinbase.com/charges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": apiKey,
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name: product.title,
      description: product.title,
      pricing_type: "fixed_price",
      local_price: { amount, currency: product.currency.toUpperCase() },
      metadata: {
        product_id: product.id,
        user_id: userData.user.id,
        affiliate_code: profile?.referred_by_code ?? "",
      },
      redirect_url: `${origin}/account`,
      cancel_url: `${origin}/product/${product.id}`,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.redirect(
      new URL(`/checkout?error=${encodeURIComponent(text)}`, request.url),
      303
    );
  }

  const json = (await resp.json()) as { data?: { hosted_url?: string } };
  const hostedUrl = json.data?.hosted_url;
  if (!hostedUrl) return NextResponse.redirect(new URL("/checkout?error=missing_hosted_url", request.url), 303);

  return NextResponse.redirect(hostedUrl, 303);
}

