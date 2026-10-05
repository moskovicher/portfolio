'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { applyGallerySelection } from '@/lib/portfolio/gallery-order';

interface Item {
  url: string;
  publicId: string;
  caption?: string;
  resourceType: 'image' | 'video';
  width?: number;
  height?: number;
}

type Size = 'full' | 'half' | 'third';

// Captions live in Cloudinary as one string. Write "עברית || English" to give
// each language its own caption; a caption without "||" shows in both.
const captionFor = (caption: string | undefined, locale: string) => {
  if (!caption) return '';
  const [he, en] = caption.split('||').map((x) => x.trim());
  if (en === undefined) return he;
  return locale === 'he' ? he : en;
};

const parse = (csv?: string) =>
  new Set((csv || '').split(',').map((s) => s.trim()).filter(Boolean));

// The gallery API returns 800px previews. Case studies run large, so ask
// Cloudinary for a bigger, auto-format version of the same asset.
const big = (item: Item) =>
  item.resourceType === 'video'
    ? // keep a plain mp4 so every browser (iPhone included) can autoplay it
      item.url.replace('f_auto,c_scale,w_800,q_80', 'c_limit,w_1600,q_auto')
    : item.url.replace('c_scale,w_800,q_80', 'c_limit,w_1800,q_auto,f_auto');

// Muted, looping, inline video that starts by itself. Browsers only allow
// autoplay when the video is muted, so we set it explicitly and call play().
function LoopVideo({ src, className, ratio }: { src: string; className: string; ratio?: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    v.addEventListener('canplay', tryPlay);
    return () => v.removeEventListener('canplay', tryPlay);
  }, [src]);
  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={className}
      style={ratio ? { aspectRatio: String(ratio) } : undefined}
    />
  );
}

function Media({
  item,
  eager = false,
  capped = false,
  tileRatio,
  locale = 'he',
}: {
  item: Item;
  locale?: string;
  eager?: boolean;
  /** Full-width items: never taller than the screen, centered. */
  capped?: boolean;
  /** Inside a row: every tile gets this shape and is cropped to fill it. */
  tileRatio?: number;
}) {
  const natural = item.width && item.height ? item.width / item.height : undefined;
  const sizeClass = tileRatio
    ? 'w-full h-auto object-cover rounded-md block bg-surface'
    : 'w-full h-auto rounded-md block bg-surface';
  const ratio = tileRatio ?? natural;
  // A tall portrait at full column width would fill several screens, so it gets
  // a narrower, centered frame. Everything else spans the column edge to edge.
  const narrow = capped && natural !== undefined && natural < 0.8;
  return (
    <figure className={`m-0 ${narrow ? 'w-full max-w-[560px] mx-auto' : ''}`}>
      {item.resourceType === 'video' ? (
        <LoopVideo src={big(item)} className={sizeClass} ratio={ratio} />
      ) : (
        <img
          src={big(item)}
          alt={captionFor(item.caption, locale)}
          loading={eager ? 'eager' : 'lazy'}
          className={sizeClass}
          style={tileRatio ? { aspectRatio: String(tileRatio) } : undefined}
        />
      )}
      {captionFor(item.caption, locale) && (
        <figcaption className="mt-2 text-sm text-ink-secondary leading-snug">{captionFor(item.caption, locale)}</figcaption>
      )}
    </figure>
  );
}

/**
 * Story layout for a case study:
 *   first image (hero) → intro text → second image → numbers → all other images
 *
 * Sizes are set per image in the admin:
 *   full  (default) one image per row
 *   half  two in a row
 *   third three in a row (good for process frames and explorations)
 * If the SECOND image is half or third, it sits beside the intro text.
 * Everything shares one column width, so all images line up on the same edges.
 * A row with a single half/third image centers it (good for a vertical phone video).
 * In a row of several images, the first image sets the shape and the others are cropped to match.
 */
export function CaseStudyImages({
  tag,
  imageOrder,
  selectedImages,
  halfImages,
  thirdImages,
  intro,
  stats,
  closing,
  locale = 'he',
}: {
  tag?: string;
  imageOrder?: string;
  selectedImages?: string;
  halfImages?: string;
  thirdImages?: string;
  intro: ReactNode;
  stats: ReactNode;
  /** Closing note (title + text). When set, the last image sits beside it. */
  closing?: ReactNode;
  locale?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(!!tag);

  useEffect(() => {
    if (!tag) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/gallery/${encodeURIComponent(tag)}`);
        const data = await res.json();
        if (!cancelled) {
          setItems(applyGallerySelection((data.images || []) as Item[], imageOrder, selectedImages));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tag, imageOrder, selectedImages]);

  const half = parse(halfImages);
  const third = parse(thirdImages);
  const sizeOf = (item: Item): Size =>
    third.has(item.publicId) ? 'third' : half.has(item.publicId) ? 'half' : 'full';

  // With a closing note, the last image belongs to it (only if there are enough
  // images left for the hero and the intro image).
  const closingItem = closing && items.length > 2 ? items[items.length - 1] : undefined;
  const galleryItems = closingItem ? items.slice(0, -1) : items;

  const [hero, second, ...rest] = galleryItems;

  // Group consecutive images of the same size into rows of 2 (half) or 3 (third).
  const rows: { size: Size; items: Item[] }[] = [];
  for (const item of rest) {
    const size = sizeOf(item);
    const last = rows[rows.length - 1];
    const capacity = size === 'third' ? 3 : size === 'half' ? 2 : 1;
    if (last && last.size === size && last.items.length < capacity) {
      last.items.push(item);
    } else {
      rows.push({ size, items: [item] });
    }
  }

  // In a row of several images, the FIRST image decides the shape of all tiles,
  // so the row lines up evenly (others are cropped to match).
  const rowRatio = (row: Item[]) => {
    const f = row[0];
    return f.width && f.height ? f.width / f.height : 1;
  };

  const secondBesideIntro = second && sizeOf(second) !== 'full';

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {loading ? (
        <div className="aspect-video rounded-md bg-surface animate-pulse" />
      ) : (
        hero && <Media locale={locale} item={hero} eager capped />
      )}

      {secondBesideIntro ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div>{intro}</div>
          <Media locale={locale} item={second} />
        </div>
      ) : (
        <>
          {intro}
          {second && <Media locale={locale} item={second} capped />}
        </>
      )}

      {stats}

      {rows.map((row, idx) => {
        if (row.size === 'full') {
          return <Media locale={locale} key={idx} item={row.items[0]} capped />;
        }
        const cols = row.size === 'third' ? 3 : 2;
        const single = row.items.length === 1;
        return (
          <div
            key={idx}
            className={`grid grid-cols-1 gap-4 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
          >
            {row.items.map((it) => (
              <div
                key={it.publicId}
                className={single ? (cols === 3 ? 'sm:col-start-2' : 'sm:col-span-2 sm:w-1/2 sm:mx-auto') : ''}
              >
                <Media locale={locale} item={it} tileRatio={single ? undefined : rowRatio(row.items)} />
              </div>
            ))}
          </div>
        );
      })}

      {closing && (
        <div
          className={`rounded-md bg-[#F3EAE3] p-7 md:p-14 grid grid-cols-1 gap-8 md:gap-12 items-center ${
            closingItem ? 'md:grid-cols-2' : ''
          }`}
        >
          {closing}
          {closingItem && <Media locale={locale} item={closingItem} />}
        </div>
      )}
    </div>
  );
}
