'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MigrateGalleryPage() {
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runPreview = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/admin/migrate-gallery');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      setPreview(await res.json());
    } catch { setError('Preview failed'); } finally { setLoading(false); }
  };

  const runMigration = async () => {
    if (!window.confirm('Add these gallery pieces to Projects? This writes to your live data.')) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/migrate-gallery', { method: 'POST' });
      setResult(await res.json());
      setPreview(null);
    } catch { setError('Migration failed'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link href="/admin" className="text-ink-secondary hover:text-ink mb-6 block">← Back to Dashboard</Link>
      <h1 className="font-display text-3xl md:text-4xl mb-2">Merge Gallery into Work</h1>
      <p className="text-sm text-ink-secondary mb-6">
        Copies gallery artworks into Projects. Safe to run more than once — pieces already in Projects are skipped, and your gallery data is never deleted.
      </p>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <button onClick={runPreview} disabled={loading} className="px-5 py-2 border border-border rounded hover:bg-surface mr-3 disabled:opacity-50">
        {loading ? 'Working…' : '1. Preview'}
      </button>

      {preview && (
        <div className="mt-6 border border-border rounded p-4 bg-surface">
          <p><strong>Artworks found:</strong> {preview.artworkCount}</p>
          <p><strong>Will add ({preview.willAdd.length}):</strong> {preview.willAdd.join(', ') || '—'}</p>
          <p><strong>Already in Projects, skipped ({preview.skipped.length}):</strong> {preview.skipped.join(', ') || '—'}</p>
          {preview.willAdd.length > 0 && (
            <button onClick={runMigration} disabled={loading} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              2. Run migration
            </button>
          )}
        </div>
      )}

      {result && (
        <div className="mt-6 border border-green-400 bg-green-50 rounded p-4">
          <p className="text-green-800"><strong>✓ Done.</strong> Added {result.added} project(s).</p>
          <p className="text-sm mt-2">Now set the order in <Link href="/admin/projects/reorder" className="underline">Projects → Reorder</Link>.</p>
        </div>
      )}
    </div>
  );
}