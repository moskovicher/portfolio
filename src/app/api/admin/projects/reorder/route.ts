import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getProjects, saveProjects } from '@/lib/blob-data';
import type { ProjectMeta } from '@/lib/portfolio/types';

/**
 * POST /api/admin/projects/reorder
 * Body: { slugs: string[] }  — the desired order of project slugs.
 *
 * Reorders the stored projects array to match `slugs`. Any project not
 * listed keeps its relative order and is appended at the end, so a stale
 * or partial list can never drop a project.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slugs } = await request.json();

    if (!Array.isArray(slugs)) {
      return NextResponse.json({ error: 'Expected { slugs: string[] }' }, { status: 400 });
    }

    const projects = await getProjects();
    const bySlug = new Map<string, ProjectMeta>(projects.map((p) => [p.slug, p]));

    const reordered: ProjectMeta[] = [];
    const used = new Set<string>();

    // First, the explicitly ordered ones (that still exist)
    for (const slug of slugs) {
      const proj = bySlug.get(slug);
      if (proj && !used.has(slug)) {
        reordered.push(proj);
        used.add(slug);
      }
    }
    // Then any project the client didn't mention, in original order
    for (const proj of projects) {
      if (!used.has(proj.slug)) reordered.push(proj);
    }

    await saveProjects(reordered);

    return NextResponse.json({ success: true, order: reordered.map((p) => p.slug) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder projects' }, { status: 500 });
  }
}
