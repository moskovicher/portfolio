import { getTranslations } from "next-intl/server";
import { getProjects } from "@/lib/blob-data";
import type { Locale, ProjectMeta } from "@/lib/portfolio/types";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return { title: t("illustrationTitle") };
}

export default async function IllustrationPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  const isRtl = locale === "he";

  const allProjects: ProjectMeta[] = await getProjects();
  // Everything published that is NOT one of the main case studies.
  const projects = allProjects.filter((p) => p.isPublished && !p.caseStudy);
  const intro = t("illustrationIntro");

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      <section className="max-w-site mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-8 md:pb-10">
        <h1 className={`text-4xl md:text-6xl leading-[0.95] tracking-tight ${isRtl ? "font-display-he" : "font-display"}`}>
          {t("illustrationTitle")}
        </h1>
        {intro && (
          <p className="mt-4 max-w-2xl text-base md:text-lg text-ink-secondary leading-relaxed">{intro}</p>
        )}
      </section>

      <section className="max-w-site mx-auto px-5 md:px-10 pb-24 md:pb-32">
        {projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded bg-surface">
            <p className="text-ink-muted text-sm tracking-wide">
              {isRtl ? "אין עדיין עבודות להצגה" : "Nothing here yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {projects.map((p) => (
              <Link
                key={p.slug}
                href={`/${locale}/portfolio/${p.slug}`}
                className="group relative block aspect-square overflow-hidden rounded border border-border bg-surface hover:border-accent hover:shadow-lg transition-all duration-300"
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.title[locale]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <h3 className={`text-2xl md:text-3xl tracking-tight text-white ${
                    p.title[locale].match(/[\u0590-\u05FF]/) ? "font-display-he" : "font-display"
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
