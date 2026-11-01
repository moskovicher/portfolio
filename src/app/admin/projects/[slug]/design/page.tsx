'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ProjectBlocks, defaultStyle } from '@/components/portfolio/ProjectBlocks';
import { applyGallerySelection } from '@/lib/portfolio/gallery-order';
import type { Block, BlockMedia, BlockStyle, LocalizedText, PageStyle, ProjectMeta } from '@/lib/portfolio/types';

/**
 * Admin → Design: a block-based layout editor for case study pages.
 *
 * Left: the page as a list of blocks (drag to reorder) and the settings of the
 * selected block. Right: a live preview that uses the very same component as the
 * public page. "Save" writes the blocks to the project; the site shows them at once.
 * A project with no blocks keeps the automatic story layout.
 */

type Lang = 'he' | 'en';
type Item = BlockMedia & { caption?: string };

const emptyLT = (): LocalizedText => ({ he: '', en: '' });
const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const TYPE_LABEL: Record<Block['type'], string> = {
  heading: 'כותרת',
  text: 'טקסט',
  images: 'תמונות',
  textImage: 'טקסט + תמונה',
  stats: 'מספרים',
  quote: 'ציטוט',
  spacer: 'רווח',
  divider: 'קו מפריד',
};

const PALETTE = ['#FBF6F2', '#FFFCFA', '#FFFFFF', '#E9DCD3', '#171210', '#6B5546', '#472D1E', '#0030F6'];

function makeBlock(type: Block['type']): Block {
  const id = newId();
  switch (type) {
    case 'heading':
    case 'text':
      return { id, type, text: emptyLT() };
    case 'images':
      return { id, type, media: [], columns: 1, caption: emptyLT() };
    case 'textImage':
      return { id, type, text: emptyLT(), title: emptyLT(), imageSide: 'start' };
    case 'stats':
      return { id, type, items: [{ value: '', label: emptyLT() }, { value: '', label: emptyLT() }, { value: '', label: emptyLT() }], note: emptyLT() };
    case 'quote':
      return { id, type, text: emptyLT(), by: emptyLT() };
    case 'spacer':
    case 'divider':
      return { id, type };
  }
}

const toMedia = (it: Item): BlockMedia => ({
  url: it.url,
  publicId: it.publicId,
  resourceType: it.resourceType,
  width: it.width,
  height: it.height,
});

/** Build a first draft from the project's existing case study fields. */
function blocksFromExisting(p: ProjectMeta, items: Item[]): Block[] {
  const ordered = applyGallerySelection(items, p.imageOrder, p.selectedImages);
  const csv = (s?: string) => new Set((s || '').split(',').map((x) => x.trim()).filter(Boolean));
  const half = csv(p.halfImages);
  const third = csv(p.thirdImages);
  const out: Block[] = [];
  const closingItem = p.closingText?.he || p.closingText?.en ? ordered[ordered.length - 1] : undefined;
  const gallery = closingItem && ordered.length > 2 ? ordered.slice(0, -1) : ordered;
  const [hero, second, ...rest] = gallery;

  if (hero) out.push({ id: newId(), type: 'images', media: [toMedia(hero)], columns: 1 });
  if (p.description?.he || p.description?.en) out.push({ id: newId(), type: 'text', text: { ...p.description } });
  if (second) out.push({ id: newId(), type: 'images', media: [toMedia(second)], columns: 1 });
  if (p.stats?.some((s) => s.value)) out.push({ id: newId(), type: 'stats', items: p.stats!, note: p.statsNote });

  // Consecutive half/third images become rows of 2 or 3.
  for (const it of rest) {
    const cols: 1 | 2 | 3 = third.has(it.publicId) ? 3 : half.has(it.publicId) ? 2 : 1;
    const last = out[out.length - 1];
    if (last && last.type === 'images' && last.columns === cols && cols > 1 && last.media.length < cols) {
      last.media.push(toMedia(it));
    } else {
      out.push({ id: newId(), type: 'images', media: [toMedia(it)], columns: cols });
    }
  }

  if (closingItem && (p.closingText?.he || p.closingText?.en)) {
    out.push({
      id: newId(),
      type: 'textImage',
      title: p.closingTitle || emptyLT(),
      text: p.closingText!,
      media: toMedia(closingItem),
      imageSide: 'end',
    });
  }
  return out;
}

// ---------- small UI pieces ----------

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1.5 text-xs rounded border ${
            value === o.value ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white border-neutral-300 hover:border-neutral-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ColorPick({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        title="ללא"
        className={`w-7 h-7 rounded border text-[10px] leading-none ${!value ? 'ring-2 ring-[#0030F6]' : ''} bg-white border-neutral-300`}
      >
        ללא
      </button>
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          title={c}
          aria-label={c}
          className={`w-7 h-7 rounded border border-neutral-300 ${value?.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-[#0030F6]' : ''}`}
          style={{ backgroundColor: c }}
        />
      ))}
      <input
        type="color"
        value={value || '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
        title="צבע אחר"
      />
      <input
        type="text"
        dir="ltr"
        value={value || ''}
        placeholder="#hex"
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-20 px-1.5 py-1 text-xs border rounded"
      />
    </div>
  );
}

function LTInput({
  value,
  onChange,
  multiline,
  placeholder,
}: {
  value?: LocalizedText;
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const v = value || emptyLT();
  const cls = 'w-full p-2 border rounded text-sm bg-white';
  return (
    <div className="flex flex-col gap-1.5">
      {multiline ? (
        <>
          <textarea dir="rtl" rows={4} className={cls} placeholder={`${placeholder || ''} (עברית)`} value={v.he} onChange={(e) => onChange({ ...v, he: e.target.value })} />
          <textarea dir="ltr" rows={4} className={cls} placeholder={`${placeholder || ''} (English)`} value={v.en} onChange={(e) => onChange({ ...v, en: e.target.value })} />
        </>
      ) : (
        <>
          <input dir="rtl" className={cls} placeholder={`${placeholder || ''} (עברית)`} value={v.he} onChange={(e) => onChange({ ...v, he: e.target.value })} />
          <input dir="ltr" className={cls} placeholder={`${placeholder || ''} (English)`} value={v.en} onChange={(e) => onChange({ ...v, en: e.target.value })} />
        </>
      )}
    </div>
  );
}

function MediaPicker({
  items,
  chosen,
  onToggle,
  single,
}: {
  items: Item[];
  chosen: string[];
  onToggle: (it: Item) => void;
  single?: boolean;
}) {
  if (!items.length) {
    return <p className="text-xs text-neutral-500">אין תמונות לתגית של הפרויקט בקלאודינרי. בדקי את שדה התגית בעמוד העריכה.</p>;
  }
  return (
    <div className="grid grid-cols-4 gap-1.5 max-h-64 overflow-y-auto p-1 border rounded bg-neutral-50">
      {items.map((it) => {
        const idx = chosen.indexOf(it.publicId);
        return (
          <button
            key={it.publicId}
            type="button"
            onClick={() => onToggle(it)}
            className={`relative aspect-square overflow-hidden rounded border-2 ${idx >= 0 ? 'border-[#0030F6]' : 'border-transparent hover:border-neutral-400'}`}
            title={it.publicId}
          >
            {it.resourceType === 'video' ? (
              <video src={it.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
            ) : (
              <img src={it.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            )}
            {it.resourceType === 'video' && <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/70 text-white px-1 rounded">וידאו</span>}
            {idx >= 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-5 h-5 px-1 rounded-full bg-[#0030F6] text-white text-[11px] leading-5 text-center">
                {single ? '✓' : idx + 1}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------- the editor ----------

export default function DesignEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('');
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pageStyle, setPageStyle] = useState<PageStyle>({});
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [lang, setLang] = useState<Lang>('he');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ slug }) => {
      setSlug(slug);
      try {
        const res = await fetch(`/api/admin/projects/${slug}`);
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        const p: ProjectMeta = await res.json();
        setProject(p);
        setBlocks(p.blocks || []);
        setPageStyle(p.pageStyle || {});
        const tag = p.cloudinaryTag || p.slug;
        const g = await fetch(`/api/gallery/${encodeURIComponent(tag)}?fresh=1`);
        const data = await g.json();
        setItems((data.images || []) as Item[]);
      } catch {
        setMessage({ kind: 'error', text: 'לא הצלחתי לטעון את הפרויקט' });
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const update = useCallback((next: Block[]) => {
    setBlocks(next);
    setDirty(true);
    setMessage(null);
  }, []);

  const patchBlock = (id: string, patch: Partial<Block>) =>
    update(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));

  const patchStyle = (id: string, patch: Partial<BlockStyle>) =>
    update(blocks.map((b) => (b.id === id ? ({ ...b, style: { ...(b.style || {}), ...patch } } as Block) : b)));

  const addBlock = (type: Block['type']) => {
    const b = makeBlock(type);
    const at = selectedId ? blocks.findIndex((x) => x.id === selectedId) + 1 : blocks.length;
    const next = [...blocks];
    next.splice(at, 0, b);
    update(next);
    setSelectedId(b.id);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return;
    const next = [...blocks];
    const [b] = next.splice(from, 1);
    next.splice(to, 0, b);
    update(next);
  };

  const duplicate = (i: number) => {
    const copy = { ...JSON.parse(JSON.stringify(blocks[i])), id: newId() } as Block;
    const next = [...blocks];
    next.splice(i + 1, 0, copy);
    update(next);
    setSelectedId(copy.id);
  };

  const remove = (i: number) => {
    const next = blocks.filter((_, j) => j !== i);
    update(next);
    if (blocks[i].id === selectedId) setSelectedId(undefined);
  };

  const save = async () => {
    if (!project) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/projects/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, blocks, pageStyle }),
      });
      if (res.status === 401) {
        setMessage({ kind: 'error', text: 'החיבור לפאנל פג. התחברי שוב בלשונית אחרת ולחצי שוב על שמירה.' });
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.project) setProject(data.project);
      setDirty(false);
      setMessage({ kind: 'ok', text: 'נשמר. השינויים כבר באתר.' });
    } catch {
      setMessage({ kind: 'error', text: 'השמירה נכשלה. השינויים שלך עדיין כאן, נסי שוב.' });
    } finally {
      setSaving(false);
    }
  };

  const selected = blocks.find((b) => b.id === selectedId);
  const selectedIndex = blocks.findIndex((b) => b.id === selectedId);

  const previewStyle = useMemo(
    () =>
      ({
        backgroundColor: pageStyle.bg || '#FBF6F2',
        color: pageStyle.color || '#171210',
        ['--page-accent' as string]: pageStyle.accent || '#0030F6',
      }) as React.CSSProperties,
    [pageStyle]
  );

  if (loading) return <div className="p-8" dir="rtl">טוען…</div>;
  if (!project) return <div className="p-8" dir="rtl">הפרויקט לא נמצא</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-neutral-100 text-neutral-900 font-body-he">
      {/* TOP BAR */}
      <header className="sticky top-0 z-20 bg-white border-b flex flex-wrap items-center gap-3 px-4 py-3">
        <a href={`/admin/projects/${slug}/edit`} className="text-sm text-neutral-600 hover:text-neutral-900">→ חזרה לעריכת הפרויקט</a>
        <h1 className="text-lg font-bold m-0">עיצוב העמוד: {project.title.he || project.title.en}</h1>
        {!project.caseStudy && (
          <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded">
            הפרויקט לא מסומן כ-Case study, ולכן העיצוב לא יופיע באתר עד שתסמני אותו.
          </span>
        )}
        <div className="flex-1" />
        <Seg value={lang} options={[{ value: 'he', label: 'עברית' }, { value: 'en', label: 'English' }]} onChange={setLang} />
        <a href={`/${lang}/portfolio/${slug}`} target="_blank" rel="noopener noreferrer" className="text-sm underline">פתיחת העמוד באתר</a>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="px-4 py-2 rounded bg-[#0030F6] text-white text-sm font-semibold disabled:opacity-40"
        >
          {saving ? 'שומרת…' : dirty ? 'שמירה' : 'נשמר'}
        </button>
      </header>
      {message && (
        <div className={`px-4 py-2 text-sm ${message.kind === 'ok' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>{message.text}</div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* SIDEBAR */}
        <aside className="lg:w-[400px] shrink-0 bg-white border-l p-4 flex flex-col gap-6 lg:h-[calc(100vh-57px)] lg:sticky lg:top-[57px] overflow-y-auto">
          {/* ADD */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold m-0">הוספת בלוק</h2>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TYPE_LABEL) as Block['type'][]).map((t) => (
                <button key={t} type="button" onClick={() => addBlock(t)} className="px-2.5 py-1.5 text-xs rounded border bg-white hover:border-neutral-500">
                  + {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 m-0">בלוק חדש נכנס מתחת לבלוק שבחרת, או בסוף העמוד.</p>
          </section>

          {/* LIST */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold m-0">סדר הבלוקים</h2>
            {blocks.length === 0 && (
              <div className="flex flex-col gap-2 text-sm text-neutral-600">
                <p className="m-0">העמוד עדיין ריק, ולכן באתר מוצגת הפריסה האוטומטית.</p>
                <button
                  type="button"
                  onClick={() => update(blocksFromExisting(project, items))}
                  className="self-start px-3 py-1.5 rounded border bg-white hover:border-neutral-500 text-xs"
                >
                  התחילי מהתוכן הקיים של הפרויקט
                </button>
              </div>
            )}
            <ol className="m-0 p-0 list-none flex flex-col gap-1">
              {blocks.map((b, i) => (
                <li
                  key={b.id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) move(dragIndex, i);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border text-sm bg-white ${
                    b.id === selectedId ? 'border-[#0030F6] bg-blue-50' : 'border-neutral-200'
                  } ${dragIndex === i ? 'opacity-50' : ''}`}
                >
                  <span className="cursor-grab text-neutral-400 select-none" title="גררי כדי להזיז" aria-hidden="true">⋮⋮</span>
                  <button type="button" onClick={() => setSelectedId(b.id)} className="flex-1 text-start truncate">
                    <span className="font-semibold">{TYPE_LABEL[b.type]}</span>
                    <span className="text-neutral-500 text-xs"> {summary(b)}</span>
                  </button>
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="px-1 disabled:opacity-30" aria-label="למעלה">↑</button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === blocks.length - 1} className="px-1 disabled:opacity-30" aria-label="למטה">↓</button>
                  <button type="button" onClick={() => duplicate(i)} className="px-1 text-xs" aria-label="שכפול" title="שכפול">⧉</button>
                  <button type="button" onClick={() => remove(i)} className="px-1 text-red-600" aria-label="מחיקה" title="מחיקה">✕</button>
                </li>
              ))}
            </ol>
          </section>

          {/* SELECTED BLOCK */}
          {selected && (
            <section className="flex flex-col gap-4 border-t pt-4">
              <h2 className="text-sm font-bold m-0">
                {TYPE_LABEL[selected.type]} <span className="text-neutral-500 font-normal">(בלוק {selectedIndex + 1})</span>
              </h2>
              <ContentFields block={selected} items={items} onPatch={(p) => patchBlock(selected.id, p)} />
              <StyleFields block={selected} onPatch={(p) => patchStyle(selected.id, p)} />
            </section>
          )}

          {/* PAGE */}
          <section className="flex flex-col gap-3 border-t pt-4">
            <h2 className="text-sm font-bold m-0">צבעי העמוד כולו</h2>
            <Field label="רקע">
              <ColorPick value={pageStyle.bg} onChange={(v) => { setPageStyle({ ...pageStyle, bg: v }); setDirty(true); }} />
            </Field>
            <Field label="טקסט">
              <ColorPick value={pageStyle.color} onChange={(v) => { setPageStyle({ ...pageStyle, color: v }); setDirty(true); }} />
            </Field>
            <Field label="צבע הדגשה (המספר האחרון בבלוק מספרים)">
              <ColorPick value={pageStyle.accent} onChange={(v) => { setPageStyle({ ...pageStyle, accent: v }); setDirty(true); }} />
            </Field>
            {blocks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('למחוק את כל הבלוקים ולחזור לפריסה האוטומטית? אחרי שמירה זה יחול על האתר.')) {
                    update([]);
                    setSelectedId(undefined);
                  }
                }}
                className="self-start text-xs text-red-700 underline"
              >
                חזרה לפריסה האוטומטית
              </button>
            )}
          </section>
        </aside>

        {/* PREVIEW */}
        <main className="flex-1 min-w-0 p-4 lg:p-8">
          <div className="mx-auto max-w-[1400px] rounded-lg overflow-hidden shadow-sm border bg-white">
            <div dir={lang === 'he' ? 'rtl' : 'ltr'} style={previewStyle} className="min-h-[60vh]" onClick={() => setSelectedId(undefined)}>
              <div className="max-w-[1060px] mx-auto px-5 md:px-10 pt-8 pb-6">
                <h1 className={`${lang === 'he' ? 'font-display-he' : 'font-display'} m-0 text-[40px] md:text-[64px] leading-[1.05]`}>
                  {project.title[lang]}
                </h1>
              </div>
              {blocks.length ? (
                <ProjectBlocks blocks={blocks} locale={lang} selectedId={selectedId} onSelect={setSelectedId} />
              ) : (
                <p className="max-w-[1060px] mx-auto px-5 md:px-10 pb-16 opacity-60">הוסיפי בלוק מהרשימה בצד כדי להתחיל.</p>
              )}
              <div className="h-16" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 text-center mt-3">
            לחיצה על בלוק בתצוגה בוחרת אותו. כדי לראות איך העמוד נראה בטלפון, פתחי אותו באתר אחרי השמירה.
          </p>
        </main>
      </div>
    </div>
  );
}

function summary(b: Block): string {
  const cut = (s?: string) => (s ? (s.length > 28 ? s.slice(0, 28) + '…' : s) : '');
  switch (b.type) {
    case 'heading':
    case 'text':
    case 'quote':
      return cut(b.text.he || b.text.en);
    case 'textImage':
      return cut(b.title?.he || b.text.he || b.text.en);
    case 'images':
      return `${b.media.length} · ${b.columns} בשורה`;
    case 'stats':
      return b.items.map((i) => i.value).filter(Boolean).join(' · ');
    default:
      return '';
  }
}

function ContentFields({ block, items, onPatch }: { block: Block; items: Item[]; onPatch: (p: Partial<Block>) => void }) {
  switch (block.type) {
    case 'heading':
      return <Field label="טקסט הכותרת"><LTInput value={block.text} onChange={(text) => onPatch({ text })} /></Field>;
    case 'text':
      return (
        <Field label="טקסט (שורה ריקה = פסקה חדשה)">
          <LTInput multiline value={block.text} onChange={(text) => onPatch({ text })} />
        </Field>
      );
    case 'quote':
      return (
        <>
          <Field label="הציטוט"><LTInput multiline value={block.text} onChange={(text) => onPatch({ text })} /></Field>
          <Field label="מי אמר (לא חובה)"><LTInput value={block.by} onChange={(by) => onPatch({ by })} /></Field>
        </>
      );
    case 'images': {
      const chosen = block.media.map((m) => m.publicId);
      const toggle = (it: Item) =>
        onPatch({
          media: chosen.includes(it.publicId)
            ? block.media.filter((m) => m.publicId !== it.publicId)
            : [...block.media, toMedia(it)],
        });
      const moveMedia = (i: number, d: number) => {
        const j = i + d;
        if (j < 0 || j >= block.media.length) return;
        const next = [...block.media];
        [next[i], next[j]] = [next[j], next[i]];
        onPatch({ media: next });
      };
      return (
        <>
          <Field label="כמה בשורה">
            <Seg
              value={String(block.columns) as '1' | '2' | '3'}
              options={[{ value: '1', label: 'אחת (רוחב מלא)' }, { value: '2', label: 'שתיים' }, { value: '3', label: 'שלוש' }]}
              onChange={(v) => onPatch({ columns: Number(v) as 1 | 2 | 3 })}
            />
          </Field>
          <Field label="בחירת תמונות (לחיצה מוסיפה או מסירה, המספר הוא הסדר)">
            <MediaPicker items={items} chosen={chosen} onToggle={toggle} />
          </Field>
          {block.media.length > 1 && (
            <Field label="הסדר">
              <div className="flex flex-wrap gap-1.5">
                {block.media.map((m, i) => (
                  <div key={m.publicId} className="flex items-center gap-1 border rounded p-1 bg-white">
                    <img src={m.url} alt="" className="w-10 h-10 object-cover rounded" />
                    <button type="button" onClick={() => moveMedia(i, -1)} className="px-1 text-xs" aria-label="קודם">→</button>
                    <button type="button" onClick={() => moveMedia(i, 1)} className="px-1 text-xs" aria-label="הבא">←</button>
                  </div>
                ))}
              </div>
            </Field>
          )}
          {block.columns > 1 && <p className="text-[11px] text-neutral-500 m-0">בשורה של כמה תמונות, הראשונה קובעת את הצורה ושאר התמונות נחתכות כך שיתאימו לה.</p>}
          <Field label="כיתוב (לא חובה)"><LTInput value={block.caption} onChange={(caption) => onPatch({ caption })} /></Field>
        </>
      );
    }
    case 'textImage':
      return (
        <>
          <Field label="כותרת (לא חובה)"><LTInput value={block.title} onChange={(title) => onPatch({ title })} /></Field>
          <Field label="טקסט"><LTInput multiline value={block.text} onChange={(text) => onPatch({ text })} /></Field>
          <Field label="צד התמונה">
            <Seg
              value={block.imageSide}
              options={[{ value: 'start', label: 'ימין בעברית, שמאל באנגלית' }, { value: 'end', label: 'שמאל בעברית, ימין באנגלית' }]}
              onChange={(imageSide) => onPatch({ imageSide })}
            />
          </Field>
          <Field label="תמונה">
            <MediaPicker
              single
              items={items}
              chosen={block.media ? [block.media.publicId] : []}
              onToggle={(it) => onPatch({ media: block.media?.publicId === it.publicId ? undefined : toMedia(it) })}
            />
          </Field>
        </>
      );
    case 'stats': {
      const rows = [...block.items];
      while (rows.length < 3) rows.push({ value: '', label: emptyLT() });
      const setRow = (i: number, patch: Partial<(typeof rows)[number]>) => {
        const next = rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
        onPatch({ items: next });
      };
      return (
        <>
          {rows.slice(0, 3).map((r, i) => (
            <Field key={i} label={`מספר ${i + 1}`}>
              <input dir="ltr" className="w-full p-2 border rounded text-sm" placeholder="200+" value={r.value} onChange={(e) => setRow(i, { value: e.target.value })} />
              <LTInput value={r.label} onChange={(label) => setRow(i, { label })} placeholder="תווית" />
            </Field>
          ))}
          <Field label="משפט מתחת למספרים (לא חובה)"><LTInput multiline value={block.note} onChange={(note) => onPatch({ note })} /></Field>
        </>
      );
    }
    default:
      return null;
  }
}

function StyleFields({ block, onPatch }: { block: Block; onPatch: (p: Partial<BlockStyle>) => void }) {
  const s = { ...defaultStyle(block.type), ...(block.style || {}) };
  const hasText = !['spacer', 'divider', 'images'].includes(block.type);
  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <h3 className="text-xs font-bold text-neutral-700 m-0">עיצוב הבלוק</h3>
      {hasText && (
        <>
          <Field label="פונט">
            <Seg value={s.font} options={[{ value: 'display', label: 'כותרות (טושיה)' }, { value: 'body', label: 'גוף' }]} onChange={(font) => onPatch({ font })} />
          </Field>
          <Field label="גודל">
            <Seg value={s.size} options={[{ value: 's', label: 'S' }, { value: 'm', label: 'M' }, { value: 'l', label: 'L' }, { value: 'xl', label: 'XL' }]} onChange={(size) => onPatch({ size })} />
          </Field>
        </>
      )}
      {block.type !== 'spacer' && block.type !== 'divider' && (
        <Field label="יישור">
          <Seg value={s.align} options={[{ value: 'start', label: 'לתחילת השורה' }, { value: 'center', label: 'מרכז' }, { value: 'end', label: 'לסוף השורה' }]} onChange={(align) => onPatch({ align })} />
        </Field>
      )}
      <Field label="רוחב">
        <Seg value={s.width} options={[{ value: 'narrow', label: 'צר (קריאה)' }, { value: 'wide', label: 'רחב' }, { value: 'full', label: 'מקצה לקצה' }]} onChange={(width) => onPatch({ width })} />
      </Field>
      <Field label="ריווח מעל ומתחת">
        <Seg value={s.space} options={[{ value: 'none', label: 'בלי' }, { value: 's', label: 'קטן' }, { value: 'm', label: 'בינוני' }, { value: 'l', label: 'גדול' }]} onChange={(space) => onPatch({ space })} />
      </Field>
      <Field label="צבע רקע לבלוק">
        <ColorPick value={block.style?.bg} onChange={(bg) => onPatch({ bg })} />
      </Field>
      {block.type !== 'spacer' && (
        <Field label="צבע טקסט">
          <ColorPick value={block.style?.color} onChange={(color) => onPatch({ color })} />
        </Field>
      )}
    </div>
  );
}
