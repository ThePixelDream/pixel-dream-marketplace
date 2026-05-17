import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.redirect(new URL("/login", request.url), 303);

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

  const stripe = getStripe();
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: userData.user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: product.currency,
          unit_amount: product.price_cents,
          product_data: { name: product.title },
        },
      },
    ],
    success_url: `${origin}/account`,
    cancel_url: `${origin}/product/${product.id}`,
    metadata: {
      product_id: product.id,
      user_id: userData.user.id,
      affiliate_code: profile?.referred_by_code ?? "",
    },
  });

  return NextResponse.redirect(session.url!, 303);
}

