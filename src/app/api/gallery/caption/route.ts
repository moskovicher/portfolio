import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Real cryptographic auth check (not just cookie presence).
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId, caption, resourceType } = await request.json();

    // Store caption in the 'alt' context field. Videos need resource_type: 'video'.
    await cloudinary.api.update(publicId, {
      resource_type: resourceType === "video" ? "video" : "image",
      context: { alt: caption },
    });
    // Let the cached galleries pick up the new caption.
    revalidateTag("gallery");

    return NextResponse.json({ success: true, caption });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save" },
      { status: 500 }
    );
  }
}