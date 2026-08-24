import type { Locale } from "@/lib/portfolio/types";
import { getShopProducts } from "@/lib/blob-data";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shop", description: "Shop" };

export default async function ShopPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const isRtl = locale === "he";

  const all = await getShopProducts();
  const products = all.filter((p: any) => p.isPublished === true);

  // Shop stays offline until there's something to sell.
  if (products.length === 0) {
    notFound();
  }

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-site mx-auto px-5 md:px-10">
        <div className="py-12 md:py-20">
          <h1 className={`font-display text-6xl md:text-7xl leading-[0.92] tracking-tight mb-12 ${isRtl ? "font-display-he" : ""}`}>
            {locale === "he" ? "חנות" : "Shop"}
          </h1>

          {products.length === 0 ? (
            <p className="text-ink-secondary">{locale === "he" ? "אין עדיין מוצרים" : "No products yet."}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {products.map((p: any) => (
                <Link key={p.slug} href={`/${locale}/shop/${p.slug}`}>
                  <div className="group cursor-pointer">
                    <div className="rounded border border-border overflow-hidden bg-surface aspect-square shadow-lg hover:shadow-xl transition-shadow relative">
                      {p.image ? (
                        <img src={p.image} alt={p.title[locale]} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface to-ink-muted flex items-center justify-center"><span className="text-ink-secondary text-sm">No image</span></div>
                      )}
                      {p.available === false && (
                        <div className="absolute top-2 left-2 bg-ink/80 text-canvas text-xs px-2 py-1 rounded">{locale === "he" ? "אזל" : "Sold out"}</div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <h3 className={`font-medium ${p.title[locale].match(/[\u0590-\u05FF]/) ? 'font-display-he' : ''}`}>{p.title[locale]}</h3>
                      {p.price && <span className="text-ink-secondary">{p.price}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
