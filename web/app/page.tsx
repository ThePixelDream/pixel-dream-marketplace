// web/app/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

const FALLBACK_VIDEOS = [
  "https://andreatuysuzian.com/arcards/videos/header/mobile/1.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/2.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/3.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/4.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/1.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/2.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/3.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/4.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/1.mp4",
  "https://andreatuysuzian.com/arcards/videos/header/mobile/2.mp4",
];

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hero_videos")
    .maybeSingle();

  const savedVideos: { url: string }[] = settings?.value?.videos ?? [];
  const videoUrls = Array.from({ length: 10 }, (_, i) =>
    savedVideos[i]?.url || FALLBACK_VIDEOS[i] || ""
  ).filter(Boolean);

  return <HomeClient videoUrls={videoUrls} />;
}
