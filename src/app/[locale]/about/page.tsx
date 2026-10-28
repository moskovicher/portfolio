import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/portfolio/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return { title: t("aboutTitle"), description: "About Shachar" };
}

// Animated self-portrait, hosted on Cloudinary.
const ABOUT_VIDEO = "https://res.cloudinary.com/dwhfkwjxo/video/upload/v1793199701/Untitled_Artwork_2_rn2vzt.mp4";

const BIO: Record<"he" | "en", string[]> = {
  he: [
    "פתרון חידות איז מיי פאשן: החל ממחקר אקדמי בתחום מדעי המוח החישוביים, דרך בנייה והובלה של קורס מתמטי לתלמידי תואר ראשון, ועד לעיצוב, מיתוג וקריאייטיב.",
    "פתוחה לעבודות מיתוג ועיצוב, הזמנות איורים אישיים, וכן איור חי באירועים.",
  ],
  en: [
    "Puzzle solving is my passion: from academic research in computational neuroscience, through building and leading a math course for undergraduate students, to design, branding, and creative.",
    "Open to brand and graphic design commissions, and custom illustrations.",
  ],
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  const isRtl = locale === "he";
  const bio = isRtl ? BIO.he : BIO.en;

  return (
    <main className="bg-canvas text-ink min-h-screen" dir={isRtl ? "rtl" : "ltr"}>
      <section className="max-w-site mx-auto px-5 md:px-10 pt-24 md:pt-32 pb-14 md:pb-20">
        <div className="grid md:grid-cols-12 md:items-center gap-y-10 md:gap-x-8">
          <div className="md:col-span-5">
            {/* ms-auto pushes the video toward the text column, in both Hebrew and English.
                overflow-hidden + a 2% scale trim the thin line browsers draw at the video's edge. */}
            <div className="w-[70%] mx-auto md:ms-auto md:me-0 aspect-square overflow-hidden">
              <video
                src={ABOUT_VIDEO}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="Shachar"
                className="block w-full h-full object-cover scale-[1.02]"
              />
            </div>
          </div>

          <div className="md:col-span-7">
            <p className="text-xs tracking-[0.22em] uppercase text-ink-secondary" dir="ltr">
              {t("aboutEyebrow")}
            </p>
            <h1
              className={`mt-5 font-display text-5xl md:text-7xl leading-[0.95] tracking-tight ${
                isRtl ? "font-display-he" : ""
              }`}
            >
              {t("aboutTitle")}
            </h1>
            <div
              className={`mt-8 space-y-4 text-lg leading-relaxed ${
                isRtl ? "font-body-he" : "font-body"
              }`}
            >
              {bio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-site mx-auto px-5 md:px-10 pb-24 md:pb-32 border-t border-border pt-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-ink-muted mb-3">
              {t("skillTools")}
            </p>
            <p className="text-sm leading-relaxed">Adobe Illustrator, Procreate, Figma, Canva</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-ink-muted mb-3">
              {t("skillLanguages")}
            </p>
            <p className="text-sm leading-relaxed">{t("skillLanguagesVal")}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-ink-muted mb-3">
              {t("skillBackground")}
            </p>
            <p className="text-sm leading-relaxed">{t("skillBackgroundVal")}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-ink-muted mb-3">
              {t("skillShown")}
            </p>
            <p className="text-sm leading-relaxed">{t("skillShownVal")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}