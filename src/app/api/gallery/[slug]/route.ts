import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Images + videos carrying a Cloudinary tag.
 *
 * Cloudinary's Admin API is rate limited (500 calls/hour on the free plan), so:
 *  - captions come back in the same call (context: true), no per-image lookups
 *    → exactly 2 Admin API calls per refresh, however many images there are;
 *  - results are cached for 5 minutes, so most visitors never reach Cloudinary;
 *  - errors are NOT swallowed: a failed refresh keeps serving the last good list
 *    instead of an empty gallery.
 * Admin screens call with ?fresh=1 to always get live data.
 */
async function loadTag(tag: string) {
  const opts = { max_results: 500, context: true };
  const [imageRes, videoRes] = await Promise.all([
    cloudinary.api.resources_by_tag(tag, { ...opts, resource_type: "image" }),
    cloudinary.api.resources_by_tag(tag, { ...opts, resource_type: "video" }),
  ]);
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return [...(imageRes.resources || []), ...(videoRes.resources || [])].map((r: any) => ({
    url:
      r.resource_type === "video"
        ? `https://res.cloudinary.com/${cloud}/video/upload/f_auto,c_scale,w_800,q_80/${r.public_id}.mp4`
        : `https://res.cloudinary.com/${cloud}/image/upload/c_scale,w_800,q_80/${r.public_id}.${r.format}`,
    publicId: r.public_id,
    format: r.format,
    width: r.width,
    height: r.height,
    caption: r.context?.custom?.alt || "",
    resourceType: r.resource_type, // 'image' | 'video'
    createdAt: r.created_at,
  }));
}

const cachedLoadTag = (tag: string) =>
  unstable_cache(() => loadTag(tag), ["gallery-tag", tag], {
    revalidate: 300,
    tags: ["gallery", `gallery:${tag}`],
  })();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const fresh = request.nextUrl.searchParams.has("fresh");
  try {
    const images = fresh ? await loadTag(slug) : await cachedLoadTag(slug);
    return NextResponse.json(
      { images, success: true },
      {
        headers: {
          "Cache-Control": fresh
            ? "no-store"
            : "public, s-maxage=60, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Gallery API error:", error);
    // Surface Cloudinary's reason (e.g. "Rate Limit Exceeded") so problems are visible.
    const e = error as { error?: { message?: string; http_code?: number }; message?: string };
    const detail = e?.error?.message || e?.message || "unknown";
    return NextResponse.json(
      { images: [], error: "Failed to fetch images", detail, success: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
