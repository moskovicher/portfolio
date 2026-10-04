'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { applyGallerySelection } from '@/lib/portfolio/gallery-order';

interface Item {
  url: string;
  publicId: string;
  caption?: string;
  resourceType: 'image' | 'video';
}

const parse = (csv?: string) =>
  new Set((csv || '').split(',').map((s) => s.trim()).filter(Boolean));

// The gallery API returns 800px previews. Case studies run full width, so ask
// Cloudinary for a larger, auto-format version of the same asset.
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
 * Images marked "half" in the admin sit side by side when two come in a row.
 */
export function CaseStudyImages({
  tag,
  imageOrder,
  selectedImages,
  halfImages,
  intro,
  stats,
}: {
  tag?: string;
  imageOrder?: string;
  selectedImages?: string;
  halfImages?: string;
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
  const [hero, second, ...rest] = items;

  // Group the remaining images: two consecutive "half" images share a row.
  const rows: Item[][] = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const b = rest[i + 1];
    if (half.has(a.publicId) && b && half.has(b.publicId)) {
      rows.push([a, b]);
      i++;
    } else {
      rows.push([a]);
    }
  }

  return (
    <div className="flex flex-col gap-16 md:gap-20">
      {loading ? (
        <div className="aspect-video rounded-md bg-surface animate-pulse" />
      ) : (
        hero && <Media item={hero} eager />
      )}

      {intro}

      {second && <Media item={second} />}

      {stats}

      {rows.map((row, idx) =>
        row.length === 2 ? (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8">
            <Media item={row[0]} />
            <Media item={row[1]} />
          </div>
        ) : (
          <Media key={idx} item={row[0]} />
        )
      )}
    </div>
  );
}
