import type { Locale } from "@/lib/portfolio/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArtworkCarousel } from "@/components/gallery/ArtworkCarousel";
import { getArtworks, getProjects } from "@/lib/blob-data";

export const dynamic = "force-dynamic";

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isRtl = locale === "he";

  // Gallery is merged into Work. If this piece has been migrated into a
  // project, send visitors to the unified Work page. Otherwise keep showing
  // the artwork here so no link ever breaks.
  const projects = await getProjects();
  if (projects.some((p) => p.slug === slug)) {
    redirect(`/${locale}/portfolio/${slug}`);
  }

  // Read directly from the data layer (admin API is auth-protected).
  const all = await getArtworks();
  const artwork: any = all.find((a: any) => a.slug === slug);

  if (!artwork) {
    return (
      <main className="bg-canvas text-ink min-h-screen">
        <div className="max-w-site mx-auto px-5 md:px-10 py-12">
          <p className="text-red-600">Artwork not found</p>
          <Link href={`/${locale}/gallery`} className="text-sm text-ink-secondary hover:text-ink mt-4 inline-block">
            ← Back to Gallery
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-site mx-auto px-5 md:px-10">
        <Link href={`/${locale}/gallery`} className="inline-flex items-center gap-2 pt-8 text-sm text-ink-secondary hover:text-ink transition-colors">
          ← {locale === "he" ? "חזרה לגלריה" : "Back to Gallery"}
        </Link>

        {/* Layout: TEXT FIRST (col 1-5), PICTURES SECOND (col 8-12) */}
        <section className="grid md:grid-cols-12 gap-8 md:gap-12 py-12 md:py-20">
          {/* TEXT - FIRST (col 1-5) */}
          <div className="md:col-span-5 md:col-start-1">
            <h1 className={`font-display text-5xl md:text-6xl leading-[0.92] tracking-tight mb-4 ${
              isRtl ? "font-display-he" : ""
            } ${artwork.title[locale].match(/[\u0590-\u05FF]/) ? 'font-display-he' : 'font-display'}`}>
              {artwork.title[locale]}
            </h1>

            <div className={`space-y-6 text-base md:text-lg leading-relaxed ${isRtl ? "font-body-he" : "font-body"}`}>
              <p className="text-ink-secondary">{artwork.description[locale]}</p>

              {artwork.year && (
                <div>
                  <p className="text-xs tracking-[0.22em] uppercase text-ink-muted mb-2">
                    {locale === "he" ? "שנה" : "Year"}
                  </p>
                  <p className="text-lg">{artwork.year}</p>
                </div>
              )}

              {artwork.dimensions && artwork.dimensions[locale] && (
                <div>
                  <p className="text-xs tracking-[0.22em] uppercase text-ink-muted mb-2">
                    {locale === "he" ? "מידות" : "Dimensions"}
                  </p>
                  <p className="text-lg">{artwork.dimensions[locale]}</p>
                </div>
              )}

              {artwork.materials && artwork.materials[locale] && (
                <div>
                  <p className="text-xs tracking-[0.22em] uppercase text-ink-muted mb-2">
                    {locale === "he" ? "חומרים" : "Materials"}
                  </p>
                  <p className="text-lg">{artwork.materials[locale]}</p>
                </div>
              )}
            </div>
          </div>

          {/* PICTURES - SECOND (col 8-12) */}
          <div className="md:col-span-5 md:col-start-8">
            {artwork.cloudinaryTag ? (
              <ArtworkCarousel tag={artwork.cloudinaryTag} imageOrder={artwork.imageOrder} />
            ) : artwork.images && artwork.images.length > 0 ? (
              <div className="space-y-4">
                {artwork.images.map((image: any, idx: number) => (
                  <div key={idx} className="rounded border border-border overflow-hidden bg-surface">
                    <img
                      src={image.url}
                      alt={image.caption?.[locale] || artwork.title[locale]}
                      className="w-full h-auto"
                    />
                    {image.caption && image.caption[locale] && (
                      <p className="text-sm text-ink-secondary p-4">{image.caption[locale]}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-96 bg-surface rounded border border-border flex items-center justify-center text-ink-secondary">
                No images
              </div>
            )}

            {artwork.video && (
              <div className="mt-4 rounded border border-border overflow-hidden bg-surface">
                <video
                  src={artwork.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}