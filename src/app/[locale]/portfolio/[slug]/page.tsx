import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/portfolio/types';
import { getProjects } from '@/lib/blob-data';
import { requireAdmin } from '@/lib/auth';
import { ProjectGalleryLightbox } from '@/components/portfolio/ProjectGalleryLightbox';
import { ArtworkCarousel } from '@/components/gallery/ArtworkCarousel';

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

  const isAdmin = await requireAdmin();

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-site mx-auto px-5 md:px-10">
        {/* HEADER SECTION */}
        <div className="py-12 md:py-20 border-b border-border">
          <h1 className={`font-display text-5xl md:text-6xl leading-[0.92] tracking-tight mb-6 md:mb-8 ${
            isRtl ? 'font-display-he' : ''
          }`}>
            {project.title[locale]}
          </h1>

          {project.award?.[locale] && (
            <div
              className="inline-block px-3 py-2 rounded text-xs tracking-[0.22em] uppercase font-medium"
              style={{ backgroundColor: project.accent + '22', color: project.accent }}
            >
              {project.award[locale]}
            </div>
          )}
        </div>

        {/* MAIN CONTENT SECTION: TEXT LEFT, IMAGE + GALLERY RIGHT */}
        <div className="py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* TEXT - LEFT (5 cols) */}
            <div className="md:col-span-5 space-y-8">
              {/* SUBTITLE */}
              {project.subtitle?.[locale] && (
                <p className="text-lg text-ink-secondary leading-relaxed font-medium">
                  {project.subtitle[locale]}
                </p>
              )}

              {/* DESCRIPTION */}
              <p className="text-base leading-relaxed text-ink">
                {project.description[locale]}
              </p>

              {/* DETAILS */}
              <div className="space-y-6 pt-8 border-t border-border">
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
              {project.externalUrl && (
                <div className="pt-4">
                  <a
                    href={project.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:underline font-medium"
                  >
                    View Project →
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