import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// One Admin API call (captions included via context: true), cached at the CDN.
export async function GET(_request: NextRequest) {
  try {
    const result = await cloudinary.api.resources_by_tag("gallery", {
      max_results: 500,
      resource_type: "image",
      context: true,
    });
    const images = (result.resources || []).map((resource: any) => ({
      url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_600,q_80/${resource.public_id}.${resource.format}`,
      publicId: resource.public_id,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      caption: resource.context?.custom?.alt || "",
    }));
    return NextResponse.json(
      { images, success: true },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    console.error("Gallery API error:", error);
    return NextResponse.json(
      { images: [], error: "Failed to fetch", success: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
