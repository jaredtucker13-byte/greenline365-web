'use client';

import { useState, useEffect, useRef } from 'react';
import {
  copyToClipboard,
  shareContent,
  canShare,
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  sendNotification,
  requestNotificationPermission,
  canNotify,
  isOnline,
  onNetworkChange,
  getCameraStream,
  capturePhoto,
  vibrate,
} from '@/lib/browser-apis';

// ============================================
// COPY BUTTON
// ============================================
export function CopyButton({ 
  text, 
  label = 'Copy',
  className = '',
  onCopy,
}: { 
  text: string; 
  label?: string;
  className?: string;
  onCopy?: (success: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    setCopied(success);
    vibrate(50);
    onCopy?.(success);
    if (success) {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        copied 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
          : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10'
      } ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ============================================
// SHARE BUTTON
// ============================================
export function ShareButton({
  title,
  text,
  url,
  className = '',
  onShare,
}: {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
  onShare?: (success: boolean) => void;
}) {
  const [shared, setShared] = useState(false);
  const canNativeShare = canShare();

  const handleShare = async () => {
    const success = await shareContent({ title, text, url });
    setShared(success);
    vibrate(50);
    onShare?.(success);
    if (success) {
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        shared 
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
          : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10'
      } ${className}`}
    >
      {shared ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {canNativeShare ? 'Shared!' : 'Link Copied!'}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}

// ============================================
// FULLSCREEN / FOCUS MODE BUTTON
// ============================================
export function FocusModeButton({
  targetRef,
  className = '',
  onToggle,
}: {
  targetRef?: React.RefObject<HTMLElement>;
  className?: string;
  onToggle?: (isFullscreen: boolean) => void;
}) {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const handler = () => {
      const full = isFullscreen();
      setIsFull(full);
      onToggle?.(full);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, [onToggle]);

  const toggle = async () => {
    if (isFull) {
      await exitFullscreen();
    } else {
      await enterFullscreen(targetRef?.current || undefined);
    }
    vibrate(30);
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isFull 
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
          : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10'
      } ${className}`}
      title={isFull ? 'Exit focus mode (Esc)' : 'Enter focus mode'}
    >
      {isFull ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit Focus
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Focus
        </>
      )}
    </button>
  );
}

// ============================================
// NETWORK STATUS INDICATOR
// ============================================
export function NetworkStatus({ className = '' }: { className?: string }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());
    return onNetworkChange(setOnline);
  }, []);

  if (online) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/90 text-white text-sm font-medium shadow-lg ${className}`}>
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      Offline - Changes will sync when back online
    </div>
  );
}

// ============================================
// NOTIFICATION PERMISSION BUTTON
// ============================================
export function NotificationButton({
  className = '',
  onPermissionChange,
}: {
  className?: string;
  onPermissionChange?: (granted: boolean) => void;
}) {
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');

  useEffect(() => {
    if (canNotify()) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequest = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    onPermissionChange?.(granted);
    
    if (granted) {
      sendNotification('Notifications Enabled! 🎉', {
        body: 'You\'ll now receive updates about bookings and content.',
      });
    }
  };

  if (!canNotify() || permission === 'granted') return null;

  return (
    <button
      onClick={handleRequest}
      disabled={permission === 'denied'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        permission === 'denied'
          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
      } ${className}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {permission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
    </button>
  );
}

// ============================================
// QR CODE GENERATOR
// ============================================
export function QRCode({
  data,
  size = 150,
  className = '',
}: {
  data: string;
  size?: number;
  className?: string;
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;

  return (
    <div className={`inline-block ${className}`}>
      <img 
        src={qrUrl} 
        alt="QR Code" 
        width={size} 
        height={size}
        className="rounded-lg"
      />
    </div>
  );
}

export function QRCodeModal({
  isOpen,
  onClose,
  data,
  title = 'Scan QR Code',
}: {
  isOpen: boolean;
  onClose: () => void;
  data: string;
  title?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex justify-center mb-4">
          <QRCode data={data} size={200} />
        </div>
        <p className="text-sm text-gray-500 mb-4 break-all">{data}</p>
        <div className="flex gap-2 justify-center">
          <CopyButton text={data} className="!bg-gray-100 !text-gray-700 !border-gray-200" />
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CAMERA CAPTURE
// ============================================
export function CameraCapture({
  onCapture,
  onClose,
  className = '',
}: {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initCamera = async () => {
      const mediaStream = await getCameraStream();
      if (mediaStream && videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      } else {
        setError('Could not access camera. Please allow camera permission.');
      }
    };
    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current) {
      const imageData = capturePhoto(videoRef.current);
      if (imageData) {
        vibrate([50, 30, 50]);
        onCapture(imageData);
        // Stop camera after capture
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col ${className}`}>
      {error ? (
        <div className="flex-1 flex items-center justify-center text-white text-center p-4">
          <div>
            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-full bg-white text-black font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="flex-1 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleCapture}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg"
            >
              <div className="w-12 h-12 rounded-full border-4 border-gray-300" />
            </button>
            <div className="w-12" /> {/* Spacer for alignment */}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// LINK PREVIEW CARD
// ============================================
export function LinkPreview({
  url,
  className = '',
}: {
  url: string;
  className?: string;
}) {
  const [preview, setPreview] = useState<{
    title?: string;
    description?: string;
    image?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // Use a free Open Graph API
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        if (data.status === 'success') {
          setPreview({
            title: data.data.title,
            description: data.data.description,
            image: data.data.image?.url,
          });
        }
      } catch (error) {
        console.error('Link preview failed:', error);
      }
      setLoading(false);
    };
    
    if (url) {
      fetchPreview();
    }
  }, [url]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-white/10 rounded-xl p-4 ${className}`}>
        <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/10 rounded w-full" />
      </div>
    );
  }

  if (!preview) return null;

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`block bg-white/10 rounded-xl overflow-hidden hover:bg-white/15 transition ${className}`}
    >
      {preview.image && (
        <img 
          src={preview.image} 
          alt={preview.title || ''} 
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-3">
        {preview.title && (
          <h4 className="font-medium text-white text-sm line-clamp-1">{preview.title}</h4>
        )}
        {preview.description && (
          <p className="text-white/60 text-xs mt-1 line-clamp-2">{preview.description}</p>
        )}
        <p className="text-white/40 text-xs mt-2 truncate">{url}</p>
      </div>
    </a>
  );
}
