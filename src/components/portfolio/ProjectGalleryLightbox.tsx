'use client';

import { useEffect, useState } from 'react';

interface GalleryImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  caption?: string;
  resourceType: 'image' | 'video';
}

interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
  isEditingCaption: boolean;
  editedCaption: string;
}

export function ProjectGalleryLightbox({
  slug,
  isAdmin,
  imageOrder,
}: {
  slug: string;
  isAdmin: boolean;
  imageOrder?: string;
}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    currentIndex: 0,
    isEditingCaption: false,
    editedCaption: '',
  });

  // Fetch images for this project
  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true);
        const response = await fetch(`/api/gallery/${slug}`);
        const data = await response.json();

        let galleryImages = data.images || [];

        // Apply the saved manual order (comma-separated publicIds). Items not
        // in the order list fall to the end, preserving their relative order.
        if (imageOrder) {
          const orderList = imageOrder.split(',').map((id: string) => id.trim());
          galleryImages = [...galleryImages].sort((a: any, b: any) => {
            const ia = orderList.indexOf(a.publicId);
            const ib = orderList.indexOf(b.publicId);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });
        }

        setImages(galleryImages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, [slug, imageOrder]);

  const openLightbox = (index: number) => {
    const item = images[index];
    // Only open lightbox for images, not videos
    if (item.resourceType === 'image') {
      setLightbox({
        isOpen: true,
        currentIndex: index,
        isEditingCaption: false,
        editedCaption: item?.caption || '',
      });
    }
  };

  const closeLightbox = () => {
    setLightbox({
      isOpen: false,
      currentIndex: 0,
      isEditingCaption: false,
      editedCaption: '',
    });
  };

  const nextImage = () => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % images.length,
      isEditingCaption: false,
      editedCaption: images[(prev.currentIndex + 1) % images.length]?.caption || '',
    }));
  };

  const prevImage = () => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + images.length) % images.length,
      isEditingCaption: false,
      editedCaption: images[(prev.currentIndex - 1 + images.length) % images.length]?.caption || '',
    }));
  };

  const startEditCaption = () => {
    setLightbox((prev) => ({
      ...prev,
      isEditingCaption: true,
      editedCaption: images[prev.currentIndex]?.caption || '',
    }));
  };

  const saveCaption = async () => {
    const currentImage = images[lightbox.currentIndex];
    if (!currentImage) return;

    try {
      const response = await fetch('/api/gallery/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: currentImage.publicId,
          caption: lightbox.editedCaption,
        }),
      });

      if (response.ok) {
        const updatedImages = [...images];
        updatedImages[lightbox.currentIndex].caption = lightbox.editedCaption;
        setImages(updatedImages);
        setLightbox((prev) => ({ ...prev, isEditingCaption: false }));
      }
    } catch (err) {
      console.error('Failed to save caption:', err);
      alert('Failed to save caption');
    }
  };

  const cancelEdit = () => {
    setLightbox((prev) => ({
      ...prev,
      isEditingCaption: false,
      editedCaption: images[prev.currentIndex]?.caption || '',
    }));
  };

  const currentImage = images[lightbox.currentIndex];

  if (loading) {
    return <div className="py-20 text-center text-ink-secondary">Loading...</div>;
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      {/* Masonry Grid Layout */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {images.map((img, idx) => (
          <div
            key={img.publicId}
            className="break-inside-avoid overflow-hidden rounded border border-border bg-surface p-2 group relative transition-all duration-300 hover:shadow-md"
          >
            {img.resourceType === 'video' ? (
              // Video - Embedded with controls, constrained to grid
              <div className="w-full bg-black rounded overflow-hidden">
                <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
                  <video
                    src={img.url}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
                {img.caption && (
                  <p className="text-xs text-ink-secondary p-2">{img.caption}</p>
                )}
              </div>
            ) : (
              // Image - Clickable for lightbox
              <div
                className="cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={img.url}
                  alt={img.publicId}
                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                  loading="lazy"
                  width={img.width}
                  height={img.height}
                />
                {img.caption && (
                  <p className="text-xs text-ink-secondary mt-2 px-1">{img.caption}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal - Images only */}
      {lightbox.isOpen && currentImage && currentImage.resourceType === 'image' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col"
          onClick={closeLightbox}
        >
          <div
            className="flex-1 flex items-center justify-center px-4 py-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-3xl hover:opacity-70 z-10"
            >
              ×
            </button>

            <img
              src={currentImage.url}
              alt={currentImage.publicId}
              className="max-h-[70vh] max-w-full object-contain"
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:opacity-70"
            >
              ‹
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:opacity-70"
            >
              ›
            </button>
          </div>

          <div
            className="bg-black bg-opacity-70 text-white px-4 py-4 flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1">
              {lightbox.isEditingCaption ? (
                <textarea
                  value={lightbox.editedCaption}
                  onChange={(e) =>
                    setLightbox((prev) => ({
                      ...prev,
                      editedCaption: e.target.value,
                    }))
                  }
                  className="w-full bg-white bg-opacity-20 text-white rounded p-2 text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm">{currentImage.caption || ''}</p>
              )}
            </div>

            {isAdmin && (
              <div className="flex gap-2 ml-4">
                {lightbox.isEditingCaption ? (
                  <>
                    <button
                      onClick={saveCaption}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditCaption}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm whitespace-nowrap"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-black bg-opacity-70 text-white text-center py-2 text-xs">
            {lightbox.currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
