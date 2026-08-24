import { redirect } from "next/navigation";
import type { Locale } from "@/lib/portfolio/types";

export const dynamic = "force-dynamic";

// Gallery has been merged into Work. Keep the old URL alive by redirecting.
export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/portfolio`);
}
