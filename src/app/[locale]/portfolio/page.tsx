import { getTranslations } from "next-intl/server";
import { getProjects } from "@/lib/blob-data";
import type { Locale, ProjectMeta } from "@/lib/portfolio/types";
import Link from "next/link";
import { BrainLine } from "@/components/portfolio/BrainLine";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return { title: t("workTitle"), description: t("heroRole") };
}

export default async function PortfolioIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  const isRtl = locale === "he";

  const allProjects: ProjectMeta[] = await getProjects();
  const published = allProjects.filter((p) => p.isPublished);
  // Case studies (ticked in the admin) are the Work page. Until at least one is
  // ticked, show everything so the page is never empty.
  const caseStudies = published.filter((p) => p.caseStudy);
  const projects = caseStudies.length > 0 ? caseStudies : published;
  const displayFont = isRtl ? "font-display-he" : "font-display";

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      {/* HERO */}
      <section className="max-w-site mx-auto px-5 md:px-10 pt-12 md:pt-24 pb-12 md:pb-20 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div>
          <p className={`${displayFont} text-[42px] md:text-[72px] leading-[1.12] whitespace-pre-line`}>
            {t("heroLine")}
          </p>
          <p className="mt-6 md:mt-7 text-lg text-ink-secondary font-semibold tracking-wide">
            {t("heroRole")}
          </p>
        </div>
        <div className="flex justify-center">
          <BrainLine className="w-full max-w-[420px] h-auto text-ink" />
        </div>
      </section>

      {/* SELECTED WORK */}
      <section className="max-w-site mx-auto px-5 md:px-10 pb-24 md:pb-32">
        <div className="flex items-baseline justify-between border-t-[1.5px] border-ink pt-3.5 mb-9">
          <h2 className="text-[15px] font-bold tracking-[0.12em] m-0">{t("selectedWork")}</h2>
          <span className="text-[15px] text-ink-secondary font-semibold">
            {String(projects.length).padStart(2, "0")}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded bg-surface">
            <p className="text-ink-muted text-sm tracking-wide">
              {isRtl ? "אין עדיין פרויקטים שפורסמו" : "No published projects found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
            {projects.map((p) => (
              <Link
                key={p.slug}
                href={`/${locale}/portfolio/${p.slug}`}
                className="group flex flex-col gap-3.5 text-ink no-underline"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-md bg-surface">
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.title[locale]}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <h3 className="text-2xl md:text-[26px] font-extrabold tracking-tight m-0 group-hover:text-accent transition-colors">
                    {p.title[locale]}
                  </h3>
                  {p.award?.[locale] && (
                    <span className="text-[13px] font-bold text-accent border-[1.5px] border-accent rounded-full px-3 py-1">
                      {p.award[locale]}
                    </span>
                  )}
                </div>
                {p.subtitle?.[locale] && (
                  <p className="-mt-1 text-base text-ink-secondary m-0">{p.subtitle[locale]}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
