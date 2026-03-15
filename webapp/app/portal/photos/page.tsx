'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setMessage({ type: 'error', text: `Photo limit reached (${maxPhotos} max).` });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setMessage(null);
    setUploadProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        errorCount++;
        continue;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        errorCount++;
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('listing_id', activeListing.id);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          // Add the uploaded photo to the listing
          const addRes = await fetch('/api/portal/listing/photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listing_id: activeListing.id,
              url: data.url,
            }),
          });

          if (addRes.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }

      setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
    }

    setUploading(false);
    setUploadProgress(0);

    if (successCount > 0) {
      setMessage({
        type: errorCount > 0 ? 'error' : 'success',
        text: errorCount > 0
          ? `${successCount} photo(s) uploaded, ${errorCount} failed.`
          : `${successCount} photo(s) uploaded successfully.`,
      });
      loadPhotos();
    } else if (errorCount > 0) {
      setMessage({ type: 'error', text: 'Failed to upload photos. Check file format and size (max 10MB).' });
    }
  };

  const handleUrlUpload = async () => {
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
    if (res.ok) {
      if (selectedPhoto === photoId) setSelectedPhoto(null);
      loadPhotos();
    }
  };

  const handleDragStart = (photoId: string) => {
    setDraggedId(photoId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(targetId);
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
    setDragOverId(null);

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

  // File drag-and-drop zone handlers
  const handleFileDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const atLimit = photos.length >= maxPhotos;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Photos</h1>
        <p className="mt-1 text-sm text-white/50">
          {photos.length}/{maxPhotos} photos used. Drag photos to reorder.
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

      {/* Upload Zone */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleFileDragEnter}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDraggingFile
            ? 'border-gold-500 bg-gold-500/10'
            : atLimit
              ? 'border-white/10 bg-white/5 opacity-50'
              : 'border-white/20 bg-white/5 hover:border-white/30'
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
            <p className="text-sm text-white/70">Uploading photos...</p>
            {uploadProgress > 0 && (
              <div className="mx-auto max-w-xs">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <svg className="mx-auto h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-3 text-sm text-white/60">
              {atLimit ? (
                'Photo limit reached'
              ) : isDraggingFile ? (
                <span className="text-gold-500 font-medium">Drop photos here</span>
              ) : (
                <>
                  Drag and drop photos here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gold-500 font-medium hover:text-gold-400"
                  >
                    browse files
                  </button>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-white/30">JPG, PNG, WebP up to 10MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              disabled={atLimit}
            />
          </>
        )}
      </div>

      {/* URL Input */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-xs font-medium text-white/40">Or add from URL</p>
        <div className="flex gap-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL..."
            disabled={atLimit}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-50"
          />
          <button
            onClick={handleUrlUpload}
            disabled={uploading || atLimit || !urlInput.trim()}
            className="rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Gallery View */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos.find(p => p.id === selectedPhoto)?.url}
              alt="Full size"
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
            <div className="mt-4 flex items-center justify-center gap-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo.id)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                    selectedPhoto === photo.id
                      ? 'border-gold-500 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-75'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-3 text-sm text-white/40">No photos yet. Upload your first photo above.</p>
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
                  ? 'border-gold-500/40'
                  : dragOverId === photo.id
                    ? 'border-gold-500/30'
                    : 'border-white/10'
              } ${draggedId === photo.id ? 'opacity-50 scale-95' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt_text || 'Listing photo'}
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => setSelectedPhoto(photo.id)}
              />
              {photo.is_cover && (
                <span className="absolute left-2 top-2 rounded bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-black">
                  COVER
                </span>
              )}
              {/* Position indicator */}
              <span className="absolute right-2 top-2 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-sm">
                {photos.indexOf(photo) + 1}
              </span>
              {/* Hover actions */}
              <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setSelectedPhoto(photo.id)}
                  className="rounded bg-white/20 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm hover:bg-white/30"
                >
                  View
                </button>
                {!photo.is_cover && (
                  <button
                    onClick={() => handleSetCover(photo.id)}
                    className="rounded bg-gold-500/30 px-2 py-1 text-[10px] font-medium text-gold-300 backdrop-blur-sm hover:bg-gold-500/40"
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

      {/* Usage bar */}
      {photos.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/50">Storage Used</span>
            <span className="text-xs font-bold text-white/70">{photos.length}/{maxPhotos}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                photos.length >= maxPhotos ? 'bg-red-500' : photos.length >= maxPhotos * 0.8 ? 'bg-yellow-500' : 'bg-gold-500'
              }`}
              style={{ width: `${(photos.length / maxPhotos) * 100}%` }}
            />
          </div>
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
