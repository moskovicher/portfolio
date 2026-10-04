'use client';

import { useEffect, useRef, useState } from 'react';

interface Image {
  url: string;
  publicId: string;
  resourceType?: 'image' | 'video';
}

interface ImageOrdererProps {
  tag: string;
  currentOrder: string; // comma-separated public IDs (order of ALL images)
  onChange: (newOrder: string) => void;
  /**
   * When true, each image gets an include/exclude toggle so only chosen
   * images are shown on the site. Off by default — existing callers keep
   * their current behaviour (order only, all images shown).
   */
  selectable?: boolean;
  /** Comma-separated publicIds currently chosen. Empty = show all. */
  selected?: string;
  /** Fires with the chosen publicIds (in order). Empty string means "all". */
  onSelectionChange?: (newSelection: string) => void;
}

export function ImageOrderer({
  tag,
  currentOrder,
  onChange,
  selectable = false,
  selected,
  onSelectionChange,
}: ImageOrdererProps) {
  const [orderedImages, setOrderedImages] = useState<Image[]>([]);
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const didInitSelection = useRef(false);
  // Only report order/selection after images actually loaded. If Cloudinary is
  // unavailable we must not overwrite the saved order with an empty one.
  const hasImages = useRef(false);

  // Fetch images by tag
  useEffect(() => {
    async function fetchImages() {
      if (!tag) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/gallery/${encodeURIComponent(tag)}?fresh=1`);
        const data = await response.json();
        const fetchedImages: Image[] = data.images || [];

        // Sort by current order if exists
        let sorted = fetchedImages;
        if (currentOrder) {
          const orderList = currentOrder.split(',').map((id) => id.trim());
          sorted = [...fetchedImages].sort((a, b) => {
            const indexA = orderList.indexOf(a.publicId);
            const indexB = orderList.indexOf(b.publicId);
            const orderA = indexA === -1 ? 999 : indexA;
            const orderB = indexB === -1 ? 999 : indexB;
            return orderA - orderB;
          });
        }
        hasImages.current = sorted.length > 0;
        setOrderedImages(sorted);

        // Initialise the chosen set once, from the saved selection (empty = all)
        if (!didInitSelection.current) {
          const chosen = (selected || '')
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
          setIncluded(
            chosen.length > 0
              ? new Set(chosen)
              : new Set(sorted.map((img) => img.publicId))
          );
          didInitSelection.current = true;
        }
      } catch (err) {
        console.error('Failed to fetch images:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag]);

  // Emit the full order whenever it changes (unchanged behaviour)
  useEffect(() => {
    if (!hasImages.current) return;
    onChange(orderedImages.map((img) => img.publicId).join(','));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedImages]);

  // Emit the chosen selection (in current order). All-included → '' (= "all").
  useEffect(() => {
    if (!selectable || !onSelectionChange || !hasImages.current) return;
    const chosenInOrder = orderedImages
      .filter((img) => included.has(img.publicId))
      .map((img) => img.publicId);
    const allIncluded = chosenInOrder.length === orderedImages.length;
    onSelectionChange(allIncluded ? '' : chosenInOrder.join(','));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [included, orderedImages]);

  const toggleInclude = (publicId: string) => {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, publicId: string) => {
    setDraggedItem(publicId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPublicId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetPublicId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = orderedImages.findIndex((img) => img.publicId === draggedItem);
    const targetIndex = orderedImages.findIndex((img) => img.publicId === targetPublicId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newOrdered = [...orderedImages];
    const [draggedImg] = newOrdered.splice(draggedIndex, 1);
    newOrdered.splice(targetIndex, 0, draggedImg);

    setOrderedImages(newOrdered);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading images...</div>;
  }

  if (orderedImages.length === 0) {
    return <div className="text-center py-8 text-ink-secondary">No images found for this tag</div>;
  }

  const chosenCount = selectable
    ? orderedImages.filter((img) => included.has(img.publicId)).length
    : orderedImages.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-secondary">
        Drag images to reorder them.
        {selectable && ' Untick an image to hide it from the site.'}
        {' '}The order will be saved automatically.
      </p>
      {selectable && (
        <p className="text-xs text-ink-muted">
          Showing <strong>{chosenCount}</strong> of {orderedImages.length} tagged image(s).
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {orderedImages.map((img, idx) => {
          const isIncluded = !selectable || included.has(img.publicId);
          return (
            <div
              key={img.publicId}
              draggable
              onDragStart={(e) => handleDragStart(e, img.publicId)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, img.publicId)}
              onDragEnd={handleDragEnd}
              className={`relative cursor-move group transition-all ${
                draggedItem === img.publicId ? 'opacity-50' : ''
              }`}
            >
              {/* Image or Video */}
              <div
                className={`aspect-square rounded border-2 overflow-hidden bg-surface transition-all relative ${
                  isIncluded ? 'border-border hover:border-ink' : 'border-dashed border-ink-muted'
                }`}
              >
                {img.resourceType === 'video' ? (
                  <>
                    <video src={img.url} muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-2xl pointer-events-none">▶</div>
                  </>
                ) : (
                  <img
                    src={img.url}
                    alt={`Image ${idx + 1}`}
                    className={`w-full h-full object-cover transition-opacity ${
                      isIncluded ? '' : 'opacity-30'
                    }`}
                  />
                )}

                {selectable && !isIncluded && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-ink/80 text-canvas text-[11px] tracking-wide px-2 py-1 rounded">
                      Hidden
                    </span>
                  </div>
                )}
              </div>

              {/* Order Badge */}
              <div className="absolute top-2 left-2 bg-ink text-canvas rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </div>

              {/* Include toggle */}
              {selectable && (
                <label
                  className="absolute top-2 right-2 flex items-center gap-1 bg-canvas/90 border border-border rounded px-1.5 py-0.5 cursor-pointer select-none"
                  title={isIncluded ? 'Shown on site — click to hide' : 'Hidden — click to show'}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isIncluded}
                    onChange={() => toggleInclude(img.publicId)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[10px] font-medium">Show</span>
                </label>
              )}

              {/* Public ID Label */}
              <p className="mt-2 text-xs text-ink-muted truncate" title={img.publicId}>
                {img.publicId}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
