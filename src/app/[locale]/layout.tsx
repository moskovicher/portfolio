import { Navbar } from '@/components/layout/Navbar';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/lib/portfolio/types';
import { getShopProducts } from '@/lib/blob-data';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Only surface the Shop when there's at least one published product.
  const products = await getShopProducts();
  const showShop = products.some((p) => p.isPublished === true);

  return (
    <>
      <Navbar locale={locale as Locale} showShop={showShop} />
      {children}
    </>
  );
}