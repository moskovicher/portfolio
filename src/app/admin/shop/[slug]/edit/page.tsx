'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageOrderer } from '@/components/admin/ImageOrderer';
import type { ShopProduct } from '@/lib/portfolio/types';

export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imgs, setImgs] = useState<Array<{ url: string; publicId: string; resourceType?: string }>>([]);
  const [form, setForm] = useState<ShopProduct | null>(null);

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      try {
        const res = await fetch(`/api/admin/shop/${p.slug}`);
        if (res.status === 401) { window.location.href = '/admin/login'; return; }
        if (!res.ok) throw new Error();
        setForm(await res.json());
      } catch { setError('Failed to load product'); }
      finally { setLoading(false); }
    });
  }, [params]);

  useEffect(() => {
    if (!form?.cloudinaryTag) { setImgs([]); return; }
    (async () => {
      try {
        const res = await fetch(`/api/gallery/${encodeURIComponent(form.cloudinaryTag || '')}?fresh=1`);
        const data = await res.json();
        setImgs(data.images || []);
      } catch { setImgs([]); }
    })();
  }, [form?.cloudinaryTag]);

  const bil = (field: string, lang: 'en' | 'he', v: string) => {
    if (!form) return;
    setForm({ ...form, [field]: { ...(form as any)[field], [lang]: v } } as ShopProduct);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/shop/${slug}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push('/admin');
    } catch { setError('Failed to update product'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm(`Delete "${form?.title.en}"?`)) return;
    await fetch(`/api/admin/shop/${slug}`, { method: 'DELETE' });
    router.push('/admin');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!form) return <div className="p-8">{error || 'Not found'}</div>;

  return (
    <main className="bg-canvas text-ink min-h-screen">
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-12">
        <Link href="/admin" className="text-sm text-ink-secondary hover:text-ink mb-8 inline-block">← Back to Dashboard</Link>
        <h1 className="font-display text-4xl mb-10">Edit {form.title.en}</h1>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}
        <form onSubmit={save} className="space-y-5">
          <label className="flex items-center gap-3 border-2 border-purple-400 bg-purple-50 p-4 rounded cursor-pointer">
            <input type="checkbox" checked={!!form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-5 h-5" />
            <span className="font-medium">{form.isPublished ? '✅ Published' : '❌ Draft'}</span>
          </label>
          <p className="text-xs text-ink-muted">Slug: <strong>{form.slug}</strong></p>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Price (e.g. ₪120)" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full p-2 border rounded" />
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.available ?? true} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> In stock</label>
          </div>
          <div className="border border-border p-4 rounded">
            <label className="block text-sm font-medium mb-1">Cloudinary Tag</label>
            <input type="text" value={form.cloudinaryTag || ''} onChange={(e) => setForm({ ...form, cloudinaryTag: e.target.value })} className="w-full p-2 border rounded mb-3" />
            {imgs.length > 0 && (
              <div className="border-2 border-green-400 bg-green-50 p-3 rounded mb-3">
                <p className="text-sm font-medium text-green-700 mb-2">📷 Card Preview Image</p>
                <div className="grid grid-cols-4 gap-2">
                  {imgs.filter((m) => m.resourceType !== 'video').map((img, idx) => {
                    const sel = form.image === img.url || form.mainImageUrl === img.url;
                    return (
                      <div key={idx} className="relative">
                        <img src={img.url} alt="" onClick={() => setForm({ ...form, image: img.url, mainImageUrl: img.url })} className={`w-full aspect-square object-cover rounded border-2 cursor-pointer ${sel ? 'border-green-600 ring-2 ring-green-400' : 'border-gray-300 hover:border-green-500'}`} />
                        {sel && <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">★</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {form.cloudinaryTag && (
              <div className="border border-border rounded p-3 bg-white">
                <h4 className="text-sm font-medium mb-3">Reorder Gallery</h4>
                <ImageOrderer tag={form.cloudinaryTag} currentOrder={form.imageOrder || ''} onChange={(o) => setForm({ ...form, imageOrder: o })} />
              </div>
            )}
          </div>
          <input type="text" placeholder="Title (EN)" value={form.title.en} onChange={(e) => bil('title', 'en', e.target.value)} className="w-full p-2 border rounded" required />
          <input type="text" placeholder="Title (HE)" value={form.title.he} onChange={(e) => bil('title', 'he', e.target.value)} className="w-full p-2 border rounded" required />
          <textarea placeholder="Description (EN)" value={form.description.en} onChange={(e) => bil('description', 'en', e.target.value)} className="w-full p-2 border rounded" rows={3} required />
          <textarea placeholder="Description (HE)" value={form.description.he} onChange={(e) => bil('description', 'he', e.target.value)} className="w-full p-2 border rounded" rows={3} required />
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 bg-ink text-canvas py-3 rounded font-medium hover:opacity-80 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" onClick={del} className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
          </div>
        </form>
      </div>
    </main>
  );
}
