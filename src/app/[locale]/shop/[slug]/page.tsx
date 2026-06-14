import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/portfolio/types';
import { getShopProducts } from '@/lib/blob-data';
import { requireAdmin } from '@/lib/auth';
import { ProjectGalleryLightbox } from '@/components/portfolio/ProjectGalleryLightbox';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: Locale }> }) {
  const { slug, locale } = await params;
  const all = await getShopProducts();
  const product = all.find((p: any) => p.slug === slug);
  if (!product) return { title: 'Not found' };
  return { title: product.title[locale], description: product.description[locale] };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; locale: Locale }> }) {
  const { slug, locale } = await params;
  const isRtl = locale === 'he';

  const all = await getShopProducts();
  const product = all.find((p: any) => p.slug === slug);
  if (!product || !product.isPublished) notFound();

  const isAdmin = await requireAdmin();
  const inquiry = encodeURIComponent(
    locale === 'he'
      ? `שלום, אני מעוניין/ת ב"${product.title.he}".`
      : `Hi, I'm interested in "${product.title.en}".`
  );

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-site mx-auto px-5 md:px-10">
        <Link href={`/${locale}/shop`} className="inline-flex items-center gap-2 pt-8 text-sm text-ink-secondary hover:text-ink">
          ← {locale === 'he' ? 'חזרה לחנות' : 'Back to Shop'}
        </Link>

        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <h1 className={`font-display text-4xl md:text-5xl leading-[0.95] tracking-tight mb-4 ${isRtl ? 'font-display-he' : ''}`}>
                {product.title[locale]}
              </h1>
              {product.price && <p className="text-2xl mb-2">{product.price}</p>}
              {product.available === false && (
                <p className="text-ink-secondary mb-4">{locale === 'he' ? 'אזל מהמלאי' : 'Currently sold out'}</p>
              )}
              <p className="text-base leading-relaxed text-ink whitespace-pre-line mb-8">{product.description[locale]}</p>
              {product.available !== false && (
                <Link href={`/${locale}/contact?message=${inquiry}`} className="inline-block bg-ink text-canvas px-6 py-3 rounded font-medium hover:opacity-80">
                  {locale === 'he' ? 'לרכישה / פנייה' : 'Inquire to purchase'}
                </Link>
              )}
            </div>
            <div className="md:col-span-7">
              {product.cloudinaryTag && <ProjectGalleryLightbox slug={product.cloudinaryTag} isAdmin={isAdmin} imageOrder={product.imageOrder} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
