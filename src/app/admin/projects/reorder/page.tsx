'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProjectItem {
  slug: string;
  title: { en: string; he: string };
  image?: string;
  isPublished?: boolean;
}

export default function ReorderProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [dragged, setDragged] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/projects');
        if (res.status === 401) { window.location.href = '/admin/login'; return; }
        const data = await res.json();
        setProjects(data.projects || []);
      } catch {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onDragStart = (e: React.DragEvent, slug: string) => {
    setDragged(slug);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e: React.DragEvent, targetSlug: string) => {
    e.preventDefault();
    if (!dragged || dragged === targetSlug) { setDragged(null); return; }
    const from = projects.findIndex((p) => p.slug === dragged);
    const to = projects.findIndex((p) => p.slug === targetSlug);
    if (from === -1 || to === -1) { setDragged(null); return; }
    const next = [...projects];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setProjects(next);
    setSaved(false);
    setDragged(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= projects.length) return;
    const next = [...projects];
    [next[index], next[to]] = [next[to], next[index]];
    setProjects(next);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/projects/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: projects.map((p) => p.slug) }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError('Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10">
      <Link href="/admin" className="text-ink-secondary hover:text-ink mb-6 block">← Back to Dashboard</Link>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl md:text-4xl">Reorder Projects</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save order'}
        </button>
      </div>
      <p className="text-sm text-ink-secondary mb-6">
        Drag a project (or use the arrows) to set the order it appears on the Work page. Remember to Save.
      </p>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <ul className="space-y-2">
        {projects.map((p, idx) => (
          <li
            key={p.slug}
            draggable
            onDragStart={(e) => onDragStart(e, p.slug)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, p.slug)}
            className={`flex items-center gap-3 border border-border rounded px-3 py-2 bg-canvas cursor-move transition-all ${
              dragged === p.slug ? 'opacity-50' : 'hover:bg-surface'
            }`}
          >
            <span className="text-ink-muted select-none" aria-hidden>⠿</span>
            <span className="w-7 text-center text-sm text-ink-muted">{idx + 1}</span>
            {p.image ? (
              <img src={p.image} alt="" className="w-12 h-12 object-cover rounded border border-border" />
            ) : (
              <div className="w-12 h-12 rounded border border-border bg-surface" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{p.title.en}</p>
              <p className="text-sm text-ink-muted truncate">{p.title.he}</p>
            </div>
            {!p.isPublished && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">Draft</span>
            )}
            <div className="flex flex-col">
              <button onClick={() => move(idx, -1)} disabled={idx === 0} className="px-2 text-ink-secondary hover:text-ink disabled:opacity-30" aria-label="Move up">▲</button>
              <button onClick={() => move(idx, 1)} disabled={idx === projects.length - 1} className="px-2 text-ink-secondary hover:text-ink disabled:opacity-30" aria-label="Move down">▼</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
