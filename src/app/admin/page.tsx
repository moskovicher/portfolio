'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Item {
  slug: string;
  title: { en: string; he: string };
  isPublished?: boolean;
}

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Item[]>([]);
  const [shop, setShop] = useState<Item[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAll() {
      try {
        const [pRes, sRes, mRes] = await Promise.all([
          fetch('/api/admin/projects'),
          fetch('/api/admin/shop'),
          fetch('/api/admin/messages'),
        ]);

        if (pRes.status === 401) {
          window.location.href = '/admin/login';
          return;
        }

        const pData = await pRes.json();
        const sData = await sRes.json();
        const mData = await mRes.json();

        setProjects(pData.projects || []);
        setShop(sData.products || []);
        setMessages(mData.messages || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  if (loading) return <div className="p-8 text-ink">Loading dashboard…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/projects/reorder"
            className="px-4 py-2 text-sm bg-ink text-canvas rounded hover:opacity-80 font-medium"
          >
            ⠿ Reorder Projects
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm border border-border rounded hover:bg-surface"
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Section
        title="Projects"
        items={projects}
        editBase="/admin/projects"
        viewBase="/en/portfolio"
        newHref="/admin/projects/new"
        reorderHref="/admin/projects/reorder"
      />

      <Section
        title="Shop"
        items={shop}
        editBase="/admin/shop"
        viewBase="/en/shop"
        newHref="/admin/shop/new"
      />

      {/* Contact messages (read-only) */}
      <section className="mb-12">
        <h2 className="font-display text-2xl mb-4 pb-2 border-b border-border">
          Messages {messages.length > 0 && <span className="text-sm text-ink-secondary">({messages.length})</span>}
        </h2>
        {messages.length === 0 ? (
          <p className="text-ink-secondary text-sm py-2">No messages yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m: any) => (
              <div key={m.id} className="border border-border rounded px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-xs text-ink-muted">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <a href={`mailto:${m.email}`} className="text-sm text-blue-600 hover:underline">{m.email}</a>
                <p className="text-sm mt-2 whitespace-pre-line">{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Section({
  title,
  items,
  editBase,
  viewBase,
  newHref,
  reorderHref,
}: {
  title: string;
  items: Item[];
  editBase: string;
  viewBase: string;
  newHref: string;
  reorderHref?: string;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <h2 className="font-display text-2xl">{title}</h2>
        <div className="flex items-center gap-2">
          {reorderHref && (
            <Link
              href={reorderHref}
              className="px-4 py-2 border border-ink rounded hover:bg-ink hover:text-canvas text-sm font-medium transition-colors"
            >
              ⠿ Reorder
            </Link>
          )}
          <Link
            href={newHref}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + New
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-ink-secondary text-sm py-2">Nothing here yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.slug}
              className="flex items-center justify-between border border-border rounded px-4 py-3 hover:bg-surface transition"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{item.title.en}</span>
                <span className="text-ink-muted text-sm">{item.title.he}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    item.isPublished
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`${editBase}/${item.slug}/edit`}
                  className="px-3 py-1.5 bg-ink text-canvas rounded text-sm hover:opacity-80"
                >
                  Edit
                </Link>
                <a
                  href={`${viewBase}/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 border border-border rounded text-sm hover:bg-canvas"
                >
                  View ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
