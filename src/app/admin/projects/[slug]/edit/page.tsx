'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageOrderer } from '@/components/admin/ImageOrderer';

interface ProjectMeta {
  slug: string;
  folder: string;
  year: number;
  featured: boolean;
  accent: string;
  videoUrl?: string;
  image: string;
  title: { en: string; he: string };
  subtitle?: { en: string; he: string };
  award?: { en: string; he: string };
  description: { en: string; he: string };
  role?: { en: string; he: string };
  tools?: string[];
  externalUrl?: string;
  cloudinaryTag?: string;
  imageOrder?: string;
  mainImageUrl?: string;
  isPublished?: boolean;
  displayMode?: 'grid' | 'carousel';
  selectedImages?: string;
}

export default function EditProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [formData, setFormData] = useState<ProjectMeta | null>(null);
  const [toolInput, setToolInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cloudinaryImages, setCloudinaryImages] = useState<Array<{ url: string; publicId: string; resourceType?: string }>>([]);

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      fetchProject(p.slug);
    });
  }, [params]);

  const fetchProject = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/projects/${slug}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch project');
      const data = await res.json();
      setFormData(data);
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Cloudinary images (and videos) for the picker whenever the tag changes
  useEffect(() => {
    if (!formData || !formData.cloudinaryTag) { setCloudinaryImages([]); return; }
    (async () => {
      try {
        const res = await fetch(`/api/gallery/${encodeURIComponent(formData.cloudinaryTag || '')}`);
        const data = await res.json();
        setCloudinaryImages(data.images || []);
      } catch {
        setCloudinaryImages([]);
      }
    })();
  }, [formData?.cloudinaryTag]);

  const handleMainImageSelect = (url: string) => {
    if (!formData) return;
    setFormData({ ...formData, image: url, mainImageUrl: url });
  };

  const addTool = () => {
    if (!formData) return;
    const trimmed = toolInput.trim();
    const currentTools = formData.tools || [];
    if (trimmed && !currentTools.includes(trimmed)) {
      setFormData({ ...formData, tools: [...currentTools, trimmed] });
      setToolInput('');
    }
  };

  const removeTool = (index: number) => {
    if (!formData) return;
    setFormData({ ...formData, tools: (formData.tools || []).filter((_, i) => i !== index) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/projects/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update project');
      router.push('/admin');
    } catch (err) {
      setError('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${formData?.title.en}"?`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      router.push('/admin');
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!formData) return <div className="p-8">Project not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <a href="/admin" className="text-ink-secondary hover:text-ink mb-6 block">← Back to Dashboard</a>
      <h1 className="text-4xl font-bold mb-8">Edit {formData.title.en}</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* PUBLISH */}
        <div className="border-2 border-purple-400 bg-purple-50 p-4 rounded">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={!!formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="w-5 h-5" />
            <span className="font-medium">{formData.isPublished ? '✅ Published' : '❌ Draft'}</span>
          </label>
        </div>

        {/* TITLE */}
        <div>
          <h3 className="font-bold mb-3">Title</h3>
          <input type="text" placeholder="Title (English)" value={formData.title.en} onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })} className="w-full p-2 border rounded mb-2" />
          <input type="text" placeholder="Title (Hebrew)" value={formData.title.he} onChange={(e) => setFormData({ ...formData, title: { ...formData.title, he: e.target.value } })} className="w-full p-2 border rounded" />
        </div>

        {/* GALLERY: tag + picker + reorder */}
        <div className="border border-border p-4 rounded">
          <h3 className="font-bold mb-3">Gallery Images & Video</h3>
          <label className="block text-sm font-medium mb-1">Cloudinary Tag</label>
          <input type="text" placeholder="e.g. nili" value={formData.cloudinaryTag || ''} onChange={(e) => setFormData({ ...formData, cloudinaryTag: e.target.value })} className="w-full p-2 border rounded mb-2" />
          <p className="text-xs text-ink-muted mb-3">Tag images AND videos in Cloudinary with this name — both appear in the gallery automatically.</p>

          {/* DISPLAY MODE: grid (default) or carousel */}
          <label className="flex items-center gap-3 mb-3 p-2 rounded bg-surface cursor-pointer">
            <input
              type="checkbox"
              checked={formData.displayMode === 'carousel'}
              onChange={(e) => setFormData({ ...formData, displayMode: e.target.checked ? 'carousel' : 'grid' })}
              className="w-5 h-5"
            />
            <span className="text-sm">
              <span className="font-medium">Display as carousel</span>
              <span className="text-ink-muted"> — one image at a time with thumbnails (default is a grid gallery)</span>
            </span>
          </label>

          {/* Main/preview image picker */}
          {cloudinaryImages.length > 0 && (
            <div className="border-2 border-green-400 bg-green-50 p-3 rounded mb-3">
              <p className="text-sm font-medium text-green-700 mb-2">📷 Select Card Preview Image</p>
              <div className="grid grid-cols-4 gap-2">
                {cloudinaryImages.filter((m) => m.resourceType !== 'video').map((img, idx) => {
                  const isSelected = formData.image === img.url || formData.mainImageUrl === img.url;
                  return (
                    <div key={idx} className="relative">
                      <img src={img.url} alt="" onClick={() => handleMainImageSelect(img.url)} className={`w-full aspect-square object-cover rounded border-2 cursor-pointer ${isSelected ? 'border-green-600 ring-2 ring-green-400' : 'border-gray-300 hover:border-green-500'}`} />
                      {isSelected && <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">★</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reorder + choose which images to show */}
          {formData.cloudinaryTag && (
            <div className="border border-border rounded p-3 bg-white">
              <h4 className="text-sm font-medium mb-3">Reorder & Choose Gallery Images</h4>
              <ImageOrderer
                tag={formData.cloudinaryTag}
                currentOrder={formData.imageOrder || ''}
                onChange={(o) => setFormData({ ...formData, imageOrder: o })}
                selectable
                selected={formData.selectedImages || ''}
                onSelectionChange={(s) => setFormData({ ...formData, selectedImages: s })}
              />
            </div>
          )}
        </div>

        {/* SUBTITLE */}
        <div>
          <h3 className="font-bold mb-3">Subtitle (Optional)</h3>
          <input type="text" placeholder="Subtitle (English)" value={formData.subtitle?.en || ''} onChange={(e) => setFormData({ ...formData, subtitle: { ...formData.subtitle || { en: '', he: '' }, en: e.target.value } })} className="w-full p-2 border rounded mb-2" />
          <input type="text" placeholder="Subtitle (Hebrew)" value={formData.subtitle?.he || ''} onChange={(e) => setFormData({ ...formData, subtitle: { ...formData.subtitle || { en: '', he: '' }, he: e.target.value } })} className="w-full p-2 border rounded" />
        </div>

        {/* DESCRIPTION */}
        <div>
          <h3 className="font-bold mb-3">Description</h3>
          <textarea placeholder="Description (English)" value={formData.description.en} onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })} className="w-full p-2 border rounded mb-2" rows={3} />
          <textarea placeholder="Description (Hebrew)" value={formData.description.he} onChange={(e) => setFormData({ ...formData, description: { ...formData.description, he: e.target.value } })} className="w-full p-2 border rounded" rows={3} />
        </div>

        {/* ROLE */}
        <div>
          <h3 className="font-bold mb-3">Role (Optional)</h3>
          <input type="text" placeholder="Role (English)" value={formData.role?.en || ''} onChange={(e) => setFormData({ ...formData, role: { ...formData.role || { en: '', he: '' }, en: e.target.value } })} className="w-full p-2 border rounded mb-2" />
          <input type="text" placeholder="Role (Hebrew)" value={formData.role?.he || ''} onChange={(e) => setFormData({ ...formData, role: { ...formData.role || { en: '', he: '' }, he: e.target.value } })} className="w-full p-2 border rounded" />
        </div>

        {/* TOOLS */}
        <div>
          <h3 className="font-bold mb-3">Tools</h3>
          <div className="flex gap-2 mb-2">
            <input type="text" placeholder="Add a tool..." value={toolInput} onChange={(e) => setToolInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTool(); } }} className="flex-1 p-2 border rounded" />
            <button type="button" onClick={addTool} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
          </div>
          {formData.tools && formData.tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tools.map((tool, idx) => (
                <span key={idx} className="bg-gray-200 px-3 py-1 rounded text-sm flex items-center gap-2">
                  {tool}
                  <button type="button" onClick={() => removeTool(idx)} className="text-red-600 hover:text-red-800 font-bold">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* OTHER */}
        <div>
          <h3 className="font-bold mb-3">Other Details</h3>
          <input type="number" placeholder="Year" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full p-2 border rounded mb-2" />
          <input type="text" placeholder="Accent Color (hex)" value={formData.accent} onChange={(e) => setFormData({ ...formData, accent: e.target.value })} className="w-full p-2 border rounded mb-2" />
          <input type="text" placeholder="External URL" value={formData.externalUrl || ''} onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })} className="w-full p-2 border rounded" />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 mt-8">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={handleDelete} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
        </div>
      </form>
    </div>
  );
}
