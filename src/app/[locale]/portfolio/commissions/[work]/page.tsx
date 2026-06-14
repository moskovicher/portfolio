import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/portfolio/types';
import { getCommissions } from '@/lib/blob-data';
import { requireAdmin } from '@/lib/auth';
import { ProjectGalleryLightbox } from '@/components/portfolio/ProjectGalleryLightbox';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ work: string; locale: Locale }> }) {
  const { work, locale } = await params;
  const all = await getCommissions();
  const commission = all.find((c: any) => c.slug === work);
  if (!commission) return { title: 'Not found' };
  return {
    title: commission.title[locale],
    description: commission.description[locale],
  };
}

export default async function CommissionDetailPage({
  params,
}: {
  params: Promise<{ work: string; locale: Locale }>;
}) {
  const { work, locale } = await params;
  const isRtl = locale === 'he';

  const all = await getCommissions();
  const commission = all.find((c: any) => c.slug === work);

  if (!commission || !commission.isPublished) notFound();

  const isAdmin = await requireAdmin();

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-site mx-auto px-5 md:px-10">
        <Link href={`/${locale}/portfolio/commissions`} className="inline-flex items-center gap-2 pt-8 text-sm text-ink-secondary hover:text-ink transition-colors">
          ← {locale === 'he' ? 'חזרה להזמנות' : 'Back to Commissions'}
        </Link>

        {/* Title */}
        <div className="py-12 md:py-16 border-b border-border">
          <h1 className={`font-display text-5xl md:text-6xl leading-[0.92] tracking-tight mb-6 ${isRtl ? 'font-display-he' : ''}`}>
            {commission.title[locale]}
          </h1>
          {commission.year && (
            <p className="text-sm text-ink-muted">{commission.year}</p>
          )}
        </div>

        {/* TEXT LEFT, GALLERY RIGHT */}
        <div className="py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <p className="text-base leading-relaxed text-ink whitespace-pre-line">
                {commission.description[locale]}
              </p>
            </div>
            <div className="md:col-span-7">
              {commission.cloudinaryTag && (
                <ProjectGalleryLightbox slug={commission.cloudinaryTag} isAdmin={isAdmin} imageOrder={commission.imageOrder} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
