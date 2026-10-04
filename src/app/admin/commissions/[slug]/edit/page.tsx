'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageOrderer } from '@/components/admin/ImageOrderer';
import type { Commission } from '@/lib/portfolio/types';

export default function EditCommissionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cloudinaryImages, setCloudinaryImages] = useState<Array<{ url: string; publicId: string }>>([]);
  const [formData, setFormData] = useState<Commission | null>(null);

  useEffect(() => {
    async function load() {
      const { slug: s } = await params;
      setSlug(s);
      try {
        const res = await fetch(`/api/admin/commissions/${s}`);
        if (res.status === 401) { window.location.href = '/admin/login'; return; }
        if (!res.ok) throw new Error('Failed to fetch commission');
        const data = await res.json();
        setFormData(data);
      } catch (err) {
        setError('Failed to load commission');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params]);

  // Fetch Cloudinary images when tag changes (for the main-image picker)
  useEffect(() => {
    if (!formData || !formData.cloudinaryTag) { setCloudinaryImages([]); return; }
    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/gallery/${encodeURIComponent(formData.cloudinaryTag || '')}?fresh=1`);
        const data = await res.json();
        setCloudinaryImages(data.images || []);
      } catch (err) {
        console.error('Failed to fetch Cloudinary images:', err);
      }
    };
    fetchImages();
  }, [formData?.cloudinaryTag]);

  const handleBilingualChange = (field: string, lang: 'en' | 'he', value: string) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: { ...(formData as any)[field], [lang]: value } } as Commission);
  };

  const handleMainImageSelect = (index: number) => {
    if (!formData) return;
    const chosen = cloudinaryImages[index];
    setFormData({ ...formData, mainImageIndex: index, image: chosen?.url || formData.image });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/commissions/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update commission');
      setSuccess('Commission updated successfully!');
      setTimeout(() => router.push('/admin/commissions'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${formData?.title.en}"?`)) return;
    try {
      const res = await fetch(`/api/admin/commissions/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/admin/commissions');
    } catch (err) {
      setError('Failed to delete commission');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!formData) {
    return (
      <main className="bg-canvas text-ink min-h-screen">
        <div className="max-w-4xl mx-auto px-5 md:px-10 py-12">
          <p className="text-red-600">{error || 'Commission not found'}</p>
          <Link href="/admin/commissions" className="text-sm text-ink-secondary hover:text-ink mt-4 inline-block">← Back</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-canvas text-ink min-h-screen">
      <div className="max-w-4xl mx-auto px-5 md:px-10 py-12">
        <Link href="/admin/commissions" className="text-sm text-ink-secondary hover:text-ink mb-8 inline-block">
          ← Back to Commissions
        </Link>

        <h1 className="font-display text-4xl md:text-5xl mb-12">Edit {formData.title.en}</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Publish */}
          <section className="border-2 border-purple-400 bg-purple-50 p-6 rounded">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isPublished" checked={!!formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="w-5 h-5 cursor-pointer" />
              <label htmlFor="isPublished" className="cursor-pointer">
                <span className="font-medium text-lg">Publish this commission</span>
                <p className="text-sm text-ink-secondary mt-1">{formData.isPublished ? '✅ Published - visible to everyone' : '❌ Draft - hidden from public'}</p>
              </label>
            </div>
          </section>

          {/* Basic */}
          <section className="border border-border p-6 rounded">
            <h2 className="text-lg font-medium mb-4">Basic Information</h2>
            <p className="text-xs text-ink-muted mb-2">Slug (cannot be changed): <strong>{formData.slug}</strong></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <input type="number" value={formData.year || ''} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })} className="w-full border border-border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Accent Color</label>
                <input type="color" value={formData.accent || '#000000'} onChange={(e) => setFormData({ ...formData, accent: e.target.value })} className="w-full border border-border rounded px-3 py-2 h-[42px]" />
              </div>
            </div>
          </section>

          {/* Gallery */}
          <section className="border border-border p-6 rounded">
            <h2 className="text-lg font-medium mb-4">Gallery Images</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cloudinary Tag</label>
                <input type="text" value={formData.cloudinaryTag || ''} onChange={(e) => setFormData({ ...formData, cloudinaryTag: e.target.value })} className="w-full border border-border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Card Preview Image (Full Cloudinary URL)</label>
                <input type="url" value={formData.image || ''} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full border border-border rounded px-3 py-2" />
              </div>

              {/* Main image picker */}
              {cloudinaryImages.length > 0 && (
                <div className="border-2 border-green-400 bg-green-50 p-4 rounded">
                  <p className="text-sm font-medium text-green-700 mb-1">📷 Select Card Preview Image</p>
                  <p className="text-xs text-green-600 mb-4">Choose which image appears on the commission card</p>
                  <div className="grid grid-cols-4 gap-3">
                    {cloudinaryImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.url}
                          alt={`Image ${idx + 1}`}
                          className={`w-full aspect-square object-cover rounded border-2 cursor-pointer transition ${formData.mainImageIndex === idx ? 'border-green-600 ring-2 ring-green-400' : 'border-gray-300 hover:border-green-500'}`}
                          onClick={() => handleMainImageSelect(idx)}
                        />
                        {formData.mainImageIndex === idx && (
                          <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">★</div>
                        )}
                        <button type="button" onClick={() => handleMainImageSelect(idx)} className={`w-full mt-2 py-1 rounded text-xs font-medium transition ${formData.mainImageIndex === idx ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-500 hover:text-white'}`}>
                          {formData.mainImageIndex === idx ? 'Main ★' : 'Set Main'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.cloudinaryTag && (
                <div className="border border-border rounded p-4 bg-white">
                  <h3 className="text-sm font-medium mb-4">Reorder Gallery Images</h3>
                  <ImageOrderer tag={formData.cloudinaryTag || ''} currentOrder={formData.imageOrder || ''} onChange={(o) => setFormData({ ...formData, imageOrder: o })} />
                </div>
              )}
            </div>
          </section>

          {/* English */}
          <section className="border border-border p-6 rounded">
            <h2 className="text-lg font-medium mb-4">English Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title (EN)</label>
                <input type="text" value={formData.title.en} onChange={(e) => handleBilingualChange('title', 'en', e.target.value)} className="w-full border border-border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (EN)</label>
                <textarea value={formData.description.en} onChange={(e) => handleBilingualChange('description', 'en', e.target.value)} className="w-full border border-border rounded px-3 py-2 h-24" required />
              </div>
            </div>
          </section>

          {/* Hebrew */}
          <section className="border border-border p-6 rounded">
            <h2 className="text-lg font-medium mb-4">Hebrew Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title (HE)</label>
                <input type="text" value={formData.title.he} onChange={(e) => handleBilingualChange('title', 'he', e.target.value)} className="w-full border border-border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (HE)</label>
                <textarea value={formData.description.he} onChange={(e) => handleBilingualChange('description', 'he', e.target.value)} className="w-full border border-border rounded px-3 py-2 h-24" required />
              </div>
            </div>
          </section>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="flex-1 bg-ink text-canvas py-3 rounded font-medium hover:opacity-80 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={handleDelete} className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
          </div>
        </form>
      </div>
    </main>
  );
}
