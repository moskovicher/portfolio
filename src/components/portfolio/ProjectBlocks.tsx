'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { Block, BlockMedia, BlockStyle, LocalizedText } from '@/lib/portfolio/types';

/**
 * Renders a page built in Admin → Design (the layout editor).
 * Used by the public case study page AND by the editor's live preview,
 * so what you see in the editor is what the site shows.
 *
 * Every block is a full-width band (so a background color can run edge to edge)
 * with its content inside a column: narrow (reading width), wide, or full.
 */

type Lang = 'he' | 'en';

const tr = (t: LocalizedText | undefined, lang: Lang) => (t ? t[lang] || '' : '');

const paragraphs = (text: string) =>
  text.split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean);

// The gallery API hands out 800px previews. Ask Cloudinary for a larger,
// auto-format version of the same asset (same rule as CaseStudyImages).
export const bigMediaUrl = (m: BlockMedia) =>
  m.resourceType === 'video'
    ? m.url.replace('f_auto,c_scale,w_800,q_80', 'c_limit,w_1600,q_auto')
    : m.url.replace('c_scale,w_800,q_80', 'c_limit,w_1800,q_auto,f_auto');

function LoopVideo({ src, className, style }: { src: string; className: string; style?: CSSProperties }) {
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
  return <video ref={ref} src={src} autoPlay muted loop playsInline preload="auto" className={className} style={style} />;
}

function Media({ m, ratio, alt }: { m: BlockMedia; ratio?: number; alt: string }) {
  const cls = `w-full h-auto block rounded-md ${ratio ? 'object-cover' : ''}`;
  const style = ratio ? { aspectRatio: String(ratio) } : undefined;
  return m.resourceType === 'video' ? (
    <LoopVideo src={bigMediaUrl(m)} className={cls} style={style} />
  ) : (
    <img src={bigMediaUrl(m)} alt={alt} loading="lazy" className={cls} style={style} />
  );
}

// ---------- style helpers ----------

const SPACE: Record<NonNullable<BlockStyle['space']>, string> = {
  none: 'py-0',
  s: 'py-4 md:py-6',
  m: 'py-8 md:py-12',
  l: 'py-14 md:py-24',
};

const WIDTH: Record<NonNullable<BlockStyle['width']>, string> = {
  narrow: 'max-w-[720px] mx-auto px-5 md:px-10',
  wide: 'max-w-[1060px] mx-auto px-5 md:px-10',
  full: 'w-full',
};

const ALIGN: Record<NonNullable<BlockStyle['align']>, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
};

const HEADING_SIZE: Record<NonNullable<BlockStyle['size']>, string> = {
  s: 'text-2xl md:text-3xl',
  m: 'text-3xl md:text-[40px]',
  l: 'text-[40px] md:text-[56px]',
  xl: 'text-5xl md:text-[80px]',
};

const TEXT_SIZE: Record<NonNullable<BlockStyle['size']>, string> = {
  s: 'text-[15px] md:text-base',
  m: 'text-[17px] md:text-[19px]',
  l: 'text-xl md:text-2xl',
  xl: 'text-2xl md:text-[32px]',
};

const fontClass = (font: BlockStyle['font'], lang: Lang) =>
  font === 'display'
    ? lang === 'he' ? 'font-display-he' : 'font-display'
    : lang === 'he' ? 'font-body-he' : 'font-body';

/** Sensible defaults per block type; the editor shows these as the starting values. */
export function defaultStyle(type: Block['type']): Required<Pick<BlockStyle, 'font' | 'size' | 'align' | 'width' | 'space'>> {
  switch (type) {
    case 'heading':
      return { font: 'display', size: 'l', align: 'start', width: 'wide', space: 's' };
    case 'quote':
      return { font: 'display', size: 'l', align: 'center', width: 'narrow', space: 'l' };
    case 'images':
      return { font: 'body', size: 's', align: 'start', width: 'wide', space: 'm' };
    case 'textImage':
      return { font: 'body', size: 'm', align: 'start', width: 'wide', space: 'm' };
    case 'stats':
      return { font: 'body', size: 'm', align: 'start', width: 'wide', space: 'm' };
    case 'spacer':
      return { font: 'body', size: 'm', align: 'start', width: 'wide', space: 'm' };
    case 'divider':
      return { font: 'body', size: 'm', align: 'start', width: 'wide', space: 's' };
    default:
      return { font: 'body', size: 'm', align: 'start', width: 'narrow', space: 's' };
  }
}

// ---------- one block ----------

function BlockBody({ block, lang }: { block: Block; lang: Lang }) {
  const s = { ...defaultStyle(block.type), ...(block.style || {}) };
  const font = fontClass(s.font, lang);

  switch (block.type) {
    case 'heading': {
      const text = tr(block.text, lang);
      if (!text) return null;
      return <h2 className={`m-0 leading-[1.05] ${font} ${HEADING_SIZE[s.size]} ${ALIGN[s.align]}`}>{text}</h2>;
    }

    case 'text': {
      const paras = paragraphs(tr(block.text, lang));
      if (!paras.length) return null;
      return (
        <div className={`flex flex-col gap-4 ${font} ${TEXT_SIZE[s.size]} leading-[1.75] ${ALIGN[s.align]}`}>
          {paras.map((p, i) => <p key={i} className="m-0">{p}</p>)}
        </div>
      );
    }

    case 'images': {
      const media = block.media || [];
      if (!media.length) return null;
      const cols = Math.min(block.columns || 1, 3);
      const first = media[0];
      // In a row of several images, the first one sets the shape and the rest are cropped to match.
      const ratio = cols > 1 && first.width && first.height ? first.width / first.height : undefined;
      const grid = cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';
      const caption = tr(block.caption, lang);
      return (
        <figure className="m-0 flex flex-col gap-3">
          <div className={`grid ${grid} gap-4 md:gap-6`}>
            {media.map((m) => <Media key={m.publicId + m.url} m={m} ratio={ratio} alt={caption} />)}
          </div>
          {caption && <figcaption className={`text-sm opacity-75 leading-snug ${font} ${ALIGN[s.align]}`}>{caption}</figcaption>}
        </figure>
      );
    }

    case 'textImage': {
      const title = tr(block.title, lang);
      const paras = paragraphs(tr(block.text, lang));
      const text = (
        <div className={`flex flex-col gap-4 ${ALIGN[s.align]}`}>
          {title && <p className={`m-0 leading-tight ${fontClass('display', lang)} text-3xl md:text-[40px]`}>{title}</p>}
          {paras.map((p, i) => (
            <p key={i} className={`m-0 leading-[1.75] ${font} ${TEXT_SIZE[s.size]}`}>{p}</p>
          ))}
        </div>
      );
      const image = block.media ? <Media m={block.media} alt={title} /> : <div />;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {block.imageSide === 'start' ? <>{image}{text}</> : <>{text}{image}</>}
        </div>
      );
    }

    case 'stats': {
      const items = (block.items || []).filter((it) => it.value && it.value.trim() !== '');
      if (!items.length) return null;
      const note = tr(block.note, lang);
      return (
        <div className="flex flex-col gap-6 border-y py-8 md:py-10" style={{ borderColor: 'currentColor' }}>
          <div className={`grid grid-cols-1 ${items.length >= 3 ? 'sm:grid-cols-3' : items.length === 2 ? 'sm:grid-cols-2' : ''} gap-8`}>
            {items.map((it, i) => (
              <div key={i} className={ALIGN[s.align]}>
                <p
                  className="m-0 text-5xl md:text-6xl font-extrabold leading-none tracking-tight"
                  style={i === items.length - 1 && items.length > 1 ? { color: 'var(--page-accent)' } : undefined}
                >
                  {/* numbers with symbols (200+, ~70%) stay left-to-right, even on the Hebrew page */}
                  <span dir="ltr" className="inline-block">{it.value}</span>
                </p>
                <p className={`mt-2 mb-0 text-base font-semibold opacity-75 ${font}`}>{tr(it.label, lang)}</p>
              </div>
            ))}
          </div>
          {note && <p className={`m-0 max-w-[62ch] leading-[1.75] ${font} ${TEXT_SIZE[s.size]}`}>{note}</p>}
        </div>
      );
    }

    case 'quote': {
      const text = tr(block.text, lang);
      if (!text) return null;
      const by = tr(block.by, lang);
      return (
        <blockquote className={`m-0 flex flex-col gap-4 ${ALIGN[s.align]}`}>
          <p className={`m-0 leading-[1.15] ${font} ${HEADING_SIZE[s.size]}`}>{text}</p>
          {by && <footer className={`text-base opacity-75 ${fontClass('body', lang)}`}>{by}</footer>}
        </blockquote>
      );
    }

    case 'spacer':
      return <div aria-hidden="true" className="h-6 md:h-10" />;

    case 'divider':
      return <hr className="m-0 border-0 border-t border-current opacity-30" />;
  }
}

export function ProjectBlocks({
  blocks,
  locale,
  selectedId,
  onSelect,
}: {
  blocks: Block[];
  locale: string;
  /** Editor only: outline the selected block and make blocks clickable. */
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const lang: Lang = locale === 'he' ? 'he' : 'en';
  return (
    <div className="flex flex-col">
      {blocks.map((block) => {
        const s = { ...defaultStyle(block.type), ...(block.style || {}) };
        const band: CSSProperties = {};
        if (block.style?.bg) band.backgroundColor = block.style.bg;
        if (block.style?.color) band.color = block.style.color;
        const inner = <BlockBody block={block} lang={lang} />;
        const editable = !!onSelect;
        const wrapperProps = editable
          ? {
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                onSelect!(block.id);
              },
              className: `${SPACE[s.space]} cursor-pointer outline-offset-[-2px] ${
                selectedId === block.id ? 'outline outline-2 outline-[#0030F6]' : 'hover:outline hover:outline-1 hover:outline-[#0030F6]/40'
              }`,
            }
          : { className: SPACE[s.space] };
        return (
          <section key={block.id} style={band} {...wrapperProps}>
            <div className={s.width === 'full' && block.type !== 'images' ? 'w-full px-5 md:px-10' : WIDTH[s.width]}>{inner ?? (editable ? <EmptyHint type={block.type} /> : null)}</div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyHint({ type }: { type: Block['type'] }): ReactNode {
  return (
    <div className="border border-dashed rounded p-4 text-sm opacity-60 text-center" style={{ borderColor: 'currentColor' }}>
      {type === 'images' ? 'בחרי תמונות לבלוק הזה' : 'הבלוק ריק. הוסיפי תוכן בצד'}
    </div>
  );
}
