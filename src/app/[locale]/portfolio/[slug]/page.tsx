import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/portfolio/types';
import { getProjects } from '@/lib/blob-data';
import { requireAdmin } from '@/lib/auth';
import { ProjectGalleryLightbox } from '@/components/portfolio/ProjectGalleryLightbox';
import { ArtworkCarousel } from '@/components/gallery/ArtworkCarousel';
import { CaseStudyImages } from '@/components/portfolio/CaseStudyImages';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { ProjectMeta } from '@/lib/portfolio/types';

const paragraphs = (text?: string) =>
  (text || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

async function CaseStudy({
  project,
  all,
  locale,
}: {
  project: ProjectMeta;
  all: ProjectMeta[];
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'portfolio' });
  const isRtl = locale === 'he';
  const displayFont = isRtl ? 'font-display-he' : 'font-display';

  const tags = (project.tags?.[locale] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const stats = (project.stats || []).filter((s) => s.value && s.value.trim() !== '');

  // Next case study, in the order set in Admin → Reorder (wraps around).
  const studies = all.filter((p) => p.isPublished && p.caseStudy);
  const i = studies.findIndex((p) => p.slug === project.slug);
  const next = studies.length > 1 ? studies[(i + 1) % studies.length] : null;

  const intro = (
    <div className="max-w-3xl flex flex-col gap-5">
      {paragraphs(project.description[locale]).map((para, idx) => (
        <p key={idx} className="m-0 text-xl md:text-[23px] leading-relaxed">{para}</p>
      ))}
    </div>
  );

  const statsBlock =
    stats.length > 0 ? (
      <div className="flex flex-col gap-7 border-y-[1.5px] border-ink py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((s, idx) => (
            <div key={idx}>
              <p
                className={`m-0 text-6xl md:text-8xl font-extrabold leading-none tracking-tight ${
                  idx === stats.length - 1 && stats.length > 1 ? 'text-accent' : ''
                }`}
              >
                {s.value}
              </p>
              <p className="mt-2 mb-0 text-lg text-ink-secondary font-semibold">{s.label?.[locale]}</p>
            </div>
          ))}
        </div>
        {project.statsNote?.[locale] && (
          <p className="m-0 max-w-3xl text-lg md:text-[19px] leading-relaxed">{project.statsNote[locale]}</p>
        )}
      </div>
    ) : null;

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-site mx-auto px-5 md:px-10 pt-8 pb-24 flex flex-col gap-16 md:gap-20">
        {/* TITLE */}
        <div className="flex flex-col gap-5">
          <Link href={`/${locale}/portfolio`} className="self-start text-[15px] font-semibold text-ink-secondary no-underline hover:text-accent py-2">
            {isRtl ? '→ ' : '← '}{t('backToAll')}
          </Link>
          <h1 className={`${displayFont} m-0 mt-2 text-[56px] md:text-[112px] leading-none`}>
            {project.title[locale]}
          </h1>
          {project.subtitle?.[locale] && (
            <p className="m-0 text-xl md:text-[22px] font-semibold text-ink-secondary">{project.subtitle[locale]}</p>
          )}
          {(tags.length > 0 || project.award?.[locale]) && (
            <div className="flex flex-wrap items-center gap-2.5 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="text-sm font-semibold border border-border rounded-full px-3.5 py-1.5">{tag}</span>
              ))}
              {project.award?.[locale] && (
                <span className="text-sm font-bold text-accent border-[1.5px] border-accent rounded-full px-3.5 py-1.5">{project.award[locale]}</span>
              )}
            </div>
          )}
        </div>

        {/* IMAGES + INTRO + NUMBERS */}
        <CaseStudyImages
          tag={project.cloudinaryTag || project.slug}
          imageOrder={project.imageOrder}
          selectedImages={project.selectedImages}
          halfImages={project.halfImages}
          intro={intro}
          stats={statsBlock}
        />

        {/* CLOSING NOTE */}
        {project.closingText?.[locale] && (
          <div className="rounded-md bg-[#F3EAE3] p-7 md:p-14 flex flex-col gap-4">
            {project.closingTitle?.[locale] && (
              <p className={`${displayFont} m-0 text-4xl md:text-[52px] leading-tight`}>{project.closingTitle[locale]}</p>
            )}
            {paragraphs(project.closingText[locale]).map((para, idx) => (
              <p key={idx} className="m-0 max-w-3xl text-lg md:text-xl leading-relaxed">{para}</p>
            ))}
          </div>
        )}

        {/* EXTERNAL LINK */}
        {project.externalUrl && project.externalUrl.trim() !== '' && (
          <a
            href={project.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded bg-accent text-white text-sm font-medium hover:opacity-85 transition-opacity"
          >
            {t('viewLive')}
            <span aria-hidden="true">{isRtl ? '\u2190' : '\u2192'}</span>
          </a>
        )}

        {/* NEXT PROJECT */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-7">
          <Link href={`/${locale}/portfolio`} className="text-base font-semibold text-ink-secondary no-underline hover:text-accent py-2">
            {isRtl ? '→ ' : '← '}{t('backToAll')}
          </Link>
          {next && (
            <Link href={`/${locale}/portfolio/${next.slug}`} className="flex flex-col items-end gap-1 no-underline text-ink hover:text-accent">
              <span className="text-sm text-ink-secondary tracking-wide">{t('nextProject')}</span>
              <span className="text-2xl md:text-[26px] font-extrabold">
                {next.title[locale]} {isRtl ? '\u2190' : '\u2192'}
              </span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: Locale }> }) {
  const { slug, locale } = await params;
  const allProjects = await getProjects();
  const project = allProjects.find((p: any) => p.slug === slug);

  if (!project) return { title: 'Not found' };

  return {
    title: project.title[locale],
    description: project.subtitle?.[locale] || project.description[locale],
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug, locale } = await params;
  const isRtl = locale === 'he';
  const allProjects = await getProjects();
  const project = allProjects.find((p: any) => p.slug === slug);

  if (!project || project.isPublished === false) {
    notFound();
  }

  if (project.caseStudy) {
    return <CaseStudy project={project} all={allProjects} locale={locale} />;
  }

  const isAdmin = await requireAdmin();

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-site mx-auto px-5 md:px-10">
        {/* HEADER SECTION — condensed */}
        <div className="pt-8 md:pt-10 pb-4 md:pb-5 border-b border-border">
          <h1 className={`font-display text-3xl md:text-4xl leading-[1.05] tracking-tight ${
            isRtl ? 'font-display-he' : ''
          }`}>
            {project.title[locale]}
          </h1>

          {project.award?.[locale] && (
            <div
              className="inline-block mt-2 px-2.5 py-1 rounded text-[11px] tracking-[0.18em] uppercase font-medium"
              style={{ backgroundColor: project.accent + '22', color: project.accent }}
            >
              {project.award[locale]}
            </div>
          )}
        </div>

        {/* MAIN CONTENT SECTION: TEXT LEFT, IMAGE + GALLERY RIGHT */}
        <div className="py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
            {/* TEXT - LEFT (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              {/* SUBTITLE */}
              {project.subtitle?.[locale] && (
                <p className="text-base text-ink-secondary leading-snug font-medium">
                  {project.subtitle[locale]}
                </p>
              )}

              {/* DESCRIPTION */}
              <p className="text-base leading-relaxed text-ink">
                {project.description[locale]}
              </p>

              {/* DETAILS */}
              <div className="space-y-3 pt-4 border-t-2 border-accent/25">
                {/* YEAR */}
                {project.year && (
                  <div>
                    <p className="text-base text-ink-secondary">{project.year}</p>
                  </div>
                )}

                {/* ROLE */}
                {project.role?.[locale] && (
                  <div>
                    <p className="text-base font-medium">{project.role[locale]}</p>
                  </div>
                )}

                {/* TOOLS */}
                {project.tools && project.tools.length > 0 && (
                  <div>
                    <p className="text-sm text-ink-secondary">{project.tools.join(' · ')}</p>
                  </div>
                )}
              </div>

              {/* EXTERNAL LINK */}
              {project.externalUrl && project.externalUrl.trim() !== '' && (
                <div className="pt-2">
                  <a
                    href={project.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-accent text-white text-sm font-medium hover:opacity-85 transition-opacity"
                  >
                    {locale === 'he' ? 'צפייה באתר' : 'Visit site'}
                    <span aria-hidden="true">{isRtl ? '\u2190' : '\u2192'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* GALLERY - RIGHT (7 cols) */}
            <div className="md:col-span-7">
              {project.displayMode === 'carousel' ? (
                <ArtworkCarousel
                  tag={project.cloudinaryTag || slug}
                  imageOrder={project.imageOrder}
                  selectedImages={project.selectedImages}
                />
              ) : (
                <ProjectGalleryLightbox
                  slug={project.cloudinaryTag || slug}
                  isAdmin={isAdmin}
                  imageOrder={project.imageOrder}
                  selectedImages={project.selectedImages}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}