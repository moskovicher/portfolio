import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getArtworks, getProjects, saveProjects } from '@/lib/blob-data';
import type { ProjectMeta } from '@/lib/portfolio/types';

const pick = (loc: any, key: string) => loc?.[key] ?? '';

function artworkToProject(a: any): ProjectMeta {
  const mainIndex = a.mainImageIndex ?? 0;
  const image = a.mainImageUrl || a.images?.[mainIndex]?.url || a.images?.[0]?.url || '';
  const subLine = (loc: string) =>
    [pick(a.materials, loc), pick(a.dimensions, loc)].filter(Boolean).join(' · ');

  return {
    slug: a.slug,
    folder: a.cloudinaryFolder || a.slug,
    year: a.year ?? new Date().getFullYear(),
    featured: false,
    accent: a.accent || '#000000',
    image,
    title: a.title,
    subtitle: (subLine('en') || subLine('he')) ? { en: subLine('en'), he: subLine('he') } : undefined,
    description: a.description,
    tools: [],
    cloudinaryTag: a.cloudinaryTag || a.slug,
    imageOrder: a.imageOrder || '',
    displayMode: a.cloudinaryTag ? 'carousel' : 'grid',
    selectedImages: '',
    isPublished: a.isPublished ?? false,
    ...(a.video ? { videoUrl: a.video } : {}),
  } as ProjectMeta;
}

// GET = dry-run preview. POST = actually migrate.
async function plan() {
  const artworks = await getArtworks();
  const projects = await getProjects();
  const existing = new Set(projects.map((p) => p.slug));
  const toAdd = artworks.filter((a: any) => !existing.has(a.slug));
  const skipped = artworks.filter((a: any) => existing.has(a.slug)).map((a: any) => a.slug);
  return { artworks, projects, toAdd, skipped };
}

export async function GET(_req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { artworks, toAdd, skipped } = await plan();
  return NextResponse.json({
    dryRun: true,
    artworkCount: artworks.length,
    willAdd: toAdd.map((a: any) => a.slug),
    skipped,
  });
}

export async function POST(_req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projects, toAdd, skipped } = await plan();
  if (toAdd.length === 0) {
    return NextResponse.json({ success: true, added: 0, skipped, message: 'Nothing to migrate.' });
  }
  const merged = [...projects, ...toAdd.map(artworkToProject)];
  await saveProjects(merged);
  return NextResponse.json({ success: true, added: toAdd.length, total: merged.length, skipped });
}