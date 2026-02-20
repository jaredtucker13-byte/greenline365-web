'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalContext } from '@/lib/hooks/usePortalContext';
import UpgradeCTA from '@/components/portal/UpgradeCTA';

interface Photo {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
  is_cover: boolean;
}

export default function PhotosPage() {
  const { activeListing, directorySubscription } = usePortalContext();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [maxPhotos, setMaxPhotos] = useState(3);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const isFree = !directorySubscription;

  const loadPhotos = useCallback(async () => {
    if (!activeListing) return;
    const res = await fetch(`/api/portal/listing/photos?listing_id=${activeListing.id}`);
    if (res.ok) {
      const data = await res.json();
      setPhotos(data.photos);
      setMaxPhotos(data.max);
    }
  }, [activeListing]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  if (!activeListing) {
    return <p className="text-white/50">No listing found.</p>;
  }

  const handleUpload = async () => {
    if (!urlInput.trim()) return;
    setUploading(true);
    setMessage(null);

    const res = await fetch('/api/portal/listing/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: activeListing.id,
        url: urlInput.trim(),
      }),
    });

    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setUrlInput('');
      setMessage({ type: 'success', text: 'Photo added.' });
      loadPhotos();
    } else {
      setMessage({ type: 'error', text: data.error });
    }
  };

  const handleSetCover = async (photoId: string) => {
    const res = await fetch(`/api/portal/listing/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_cover' }),
    });
    if (res.ok) loadPhotos();
  };

  const handleDelete = async (photoId: string) => {
    const res = await fetch(`/api/portal/listing/photos/${photoId}`, {
      method: 'DELETE',
    });
    if (res.ok) loadPhotos();
  };

  const handleDragStart = (photoId: string) => {
    setDraggedId(photoId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      const draggedIndex = photos.findIndex((p) => p.id === draggedId);
      const targetIndex = photos.findIndex((p) => p.id === targetId);
      const reordered = [...photos];
      const [removed] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, removed);
      setPhotos(reordered);
    }
  };

  const handleDragEnd = async () => {
    if (!draggedId) return;
    setDraggedId(null);

    // Save new positions
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].position !== i) {
        await fetch(`/api/portal/listing/photos/${photos[i].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reorder', position: i }),
        });
      }
    }
  };

  const atLimit = photos.length >= maxPhotos;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Photos</h1>
        <p className="mt-1 text-sm text-white/50">
          {photos.length}/{maxPhotos} photos used. Drag to reorder.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Upload */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex gap-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL..."
            disabled={atLimit}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-neon-green-500 focus:outline-none focus:ring-1 focus:ring-neon-green-500 disabled:opacity-50"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || atLimit || !urlInput.trim()}
            className="rounded-lg bg-neon-green-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neon-green-400 disabled:opacity-50"
          >
            {uploading ? 'Adding...' : 'Add Photo'}
          </button>
        </div>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-3 text-sm text-white/40">No photos yet. Add your first photo above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(photo.id)}
              onDragOver={(e) => handleDragOver(e, photo.id)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square cursor-grab overflow-hidden rounded-xl border transition-all ${
                photo.is_cover
                  ? 'border-neon-green-500/40'
                  : 'border-white/10'
              } ${draggedId === photo.id ? 'opacity-50' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt_text || 'Listing photo'}
                className="h-full w-full object-cover"
              />
              {photo.is_cover && (
                <span className="absolute left-2 top-2 rounded bg-neon-green-500 px-2 py-0.5 text-[10px] font-bold text-black">
                  COVER
                </span>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                {!photo.is_cover && (
                  <button
                    onClick={() => handleSetCover(photo.id)}
                    className="rounded bg-white/20 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm hover:bg-white/30"
                  >
                    Set Cover
                  </button>
                )}
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="rounded bg-red-500/20 px-2 py-1 text-[10px] font-medium text-red-400 backdrop-blur-sm hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upgrade CTA when at limit on free */}
      {atLimit && isFree && (
        <UpgradeCTA
          feature="More Photos"
          description="Upgrade to Pro for up to 20 photos to showcase your business."
        />
      )}
    </div>
  );
}
