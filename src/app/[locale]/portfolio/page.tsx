import { getTranslations } from "next-intl/server";
import { getProjects } from "@/lib/blob-data";
import type { Locale } from "@/lib/portfolio/types";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return { title: t("workTitle"), description: t("workIntro") };
}

export default async function PortfolioIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  const isRtl = locale === "he";

  // Filter out any projects that are marked as drafts before rendering
  const allProjects = await getProjects();
  const publishedProjects = allProjects.filter((p: any) => p.isPublished);
  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      <section className="max-w-site mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-8 md:pb-10">
        <div className="grid md:grid-cols-12 gap-y-8 md:gap-x-12">
          <div className="md:col-span-7">
            <h1 className={`font-display text-4xl md:text-6xl leading-[0.95] tracking-tight ${isRtl ? "font-display-he" : ""}`}>
              {t("workTitle")}
            </h1>
          </div>
          <div className="md:col-span-5 md:pt-3">
            <p className={`text-base md:text-lg text-ink-secondary leading-relaxed ${isRtl ? "font-body-he" : "font-body"}`}>
              {t("workIntro")}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-site mx-auto px-5 md:px-10 pb-24 md:pb-32">
        {publishedProjects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded bg-surface">
            <p className="text-ink-muted text-sm tracking-wide">
              {locale === "he" ? "אין עדיין פרויקטים שפורסמו" : "No published projects found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {publishedProjects.map((p) => (
              <Link
                key={p.slug}
                href={`/${locale}/portfolio/${p.slug}`}
                className="group relative block aspect-square overflow-hidden rounded border border-border bg-surface hover:shadow-lg transition-shadow duration-300"
              >
                {/* Project Image */}
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.title[locale]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* Overlay with project name - appears on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <h3 className={`text-2xl md:text-3xl tracking-tight text-white ${
                    p.title[locale].match(/[\u0590-\u05FF]/) ? 'font-display-he' : 'font-display'
                  }`}>
                    {p.title[locale]}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}