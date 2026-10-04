'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
  item.url
    .replace('c_scale,w_800,q_80', 'c_limit,w_1800,q_auto,f_auto')
    .replace('f_auto,c_scale,w_800,q_80', 'f_auto,c_limit,w_1600,q_auto');

function Media({ item, eager = false }: { item: Item; eager?: boolean }) {
  return (
    <figure className="m-0">
      {item.resourceType === 'video' ? (
        <video
          src={big(item)}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-auto rounded-md block bg-surface"
        />
      ) : (
        <img
          src={big(item)}
          alt={item.caption || ''}
          loading={eager ? 'eager' : 'lazy'}
          className="w-full h-auto rounded-md block bg-surface"
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
        hero && <Media item={hero} eager />
      )}

      {secondBesideIntro ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div>{intro}</div>
          <Media item={second} />
        </div>
      ) : (
        <>
          {intro}
          {second && <Media item={second} />}
        </>
      )}

      {stats}

      {rows.map((row, idx) =>
        row.size === 'full' ? (
          <Media key={idx} item={row.items[0]} />
        ) : (
          <div
            key={idx}
            className={`grid grid-cols-1 gap-8 md:gap-6 ${
              row.size === 'third' ? 'sm:grid-cols-2 md:grid-cols-3' : 'md:grid-cols-2'
            }`}
          >
            {row.items.map((it) => (
              <Media key={it.publicId} item={it} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
