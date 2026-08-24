/**
 * applyGallerySelection — single source of truth for turning the full set of
 * tag images into the exact list a project should display.
 *
 * Rules (backward compatible):
 *  1. If `selectedImages` is set → keep ONLY those publicIds, in that order.
 *  2. Else if `imageOrder` is set → keep all, ordered by it (unlisted go last).
 *  3. Else → return as-is.
 */
export function applyGallerySelection<T extends { publicId: string }>(
  images: T[],
  imageOrder?: string,
  selectedImages?: string
): T[] {
  const parse = (csv?: string) =>
    (csv || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

  const selected = parse(selectedImages);
  if (selected.length > 0) {
    const rank = new Map(selected.map((id, i) => [id, i]));
    return images
      .filter((img) => rank.has(img.publicId))
      .sort((a, b) => rank.get(a.publicId)! - rank.get(b.publicId)!);
  }

  const order = parse(imageOrder);
  if (order.length > 0) {
    const rankOf = (id: string) => {
      const i = order.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...images].sort((a, b) => rankOf(a.publicId) - rankOf(b.publicId));
  }

  return images;
}
