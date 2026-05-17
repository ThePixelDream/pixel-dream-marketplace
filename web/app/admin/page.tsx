// web/app/admin/page.tsx

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/marketplace");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(title)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: commissions } = await supabase
    .from("commissions")
    .select("*, profiles(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: heroSettings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hero_videos")
    .maybeSingle();

  return (
    <AdminClient
      products={products ?? []}
      orders={orders ?? []}
      commissions={commissions ?? []}
      heroVideos={heroSettings?.value?.videos ?? []}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
    />
  );
}
