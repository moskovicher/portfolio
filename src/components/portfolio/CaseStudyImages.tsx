'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { applyGallerySelection } from '@/lib/portfolio/gallery-order';

interface Item {
  url: string;
  publicId: string;
  caption?: string;
  resourceType: 'image' | 'video';
}

type Size = 'full' | 'half' | 'third';

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
function LoopVideo({ src, className }: { src: string; className: string }) {
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
    />
  );
}

function Media({
  item,
  eager = false,
  capped = false,
}: {
  item: Item;
  eager?: boolean;
  /** Full-width items: never taller than the screen, centered. */
  capped?: boolean;
}) {
  const sizeClass = capped
    ? 'block mx-auto w-auto max-w-full max-h-[85vh] h-auto rounded-md bg-surface'
    : 'w-full h-auto rounded-md block bg-surface';
  return (
    <figure className="m-0">
      {item.resourceType === 'video' ? (
        <LoopVideo src={big(item)} className={sizeClass} />
      ) : (
        <img
          src={big(item)}
          alt={item.caption || ''}
          loading={eager ? 'eager' : 'lazy'}
          className={sizeClass}
        />
      )}
      {item.caption && (
        <figcaption className="mt-2.5 text-[15px] text-ink-secondary">{item.caption}</figcaption>
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
 * Rows that are not full are centered. Full-width items never exceed the screen height.
 */
export function CaseStudyImages({
  tag,
  imageOrder,
  selectedImages,
  halfImages,
  thirdImages,
  intro,
  stats,
}: {
  tag?: string;
  imageOrder?: string;
  selectedImages?: string;
  halfImages?: string;
  thirdImages?: string;
  intro: ReactNode;
  stats: ReactNode;
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

  const [hero, second, ...rest] = items;

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

  const secondBesideIntro = second && sizeOf(second) !== 'full';

  return (
    <div className="flex flex-col gap-16 md:gap-20">
      {loading ? (
        <div className="aspect-video rounded-md bg-surface animate-pulse" />
      ) : (
        hero && <Media item={hero} eager capped />
      )}

      {secondBesideIntro ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div>{intro}</div>
          <Media item={second} />
        </div>
      ) : (
        <>
          {intro}
          {second && <Media item={second} capped />}
        </>
      )}

      {stats}

      {rows.map((row, idx) =>
        row.size === 'full' ? (
          <Media key={idx} item={row.items[0]} capped />
        ) : (
          // Flex row: items keep their own proportions, align to the top, and a
          // row that is not full (one half, or two thirds) is centered.
          <div key={idx} className="flex flex-wrap justify-center items-start gap-x-6 gap-y-10">
            {row.items.map((it) => (
              <div
                key={it.publicId}
                className={
                  row.size === 'third'
                    ? 'w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)]'
                    : 'w-full md:w-[calc(50%-12px)]'
                }
              >
                <Media item={it} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
