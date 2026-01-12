'use client';

/**
 * Browser API Utilities
 * Free browser APIs to enhance GreenLine365
 */

// ============================================
// 1. CLIPBOARD API - Copy to clipboard
// ============================================
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
};

// ============================================
// 2. WEB SHARE API - Native sharing
// ============================================
export const canShare = (): boolean => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

export const shareContent = async (data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return true;
    }
    // Fallback: copy URL to clipboard
    if (data.url) {
      return await copyToClipboard(data.url);
    }
    return false;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
};

// ============================================
// 3. FULLSCREEN API - Focus mode
// ============================================
export const enterFullscreen = async (element?: HTMLElement): Promise<boolean> => {
  try {
    const el = element || document.documentElement;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      await (el as any).webkitRequestFullscreen();
    } else if ((el as any).msRequestFullscreen) {
      await (el as any).msRequestFullscreen();
    }
    return true;
  } catch (error) {
    console.error('Fullscreen failed:', error);
    return false;
  }
};

export const exitFullscreen = async (): Promise<boolean> => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
    return true;
  } catch (error) {
    console.error('Exit fullscreen failed:', error);
    return false;
  }
};

export const isFullscreen = (): boolean => {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  );
};

// ============================================
// 4. NOTIFICATIONS API - Push notifications
// ============================================
export const canNotify = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!canNotify()) return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Notification permission failed:', error);
    return false;
  }
};

export const sendNotification = (title: string, options?: NotificationOptions): Notification | null => {
  if (!canNotify() || Notification.permission !== 'granted') {
    return null;
  }
  
  try {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch (error) {
    console.error('Notification failed:', error);
    return null;
  }
};

// ============================================
// 5. NETWORK STATUS - Online/Offline detection
// ============================================
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

export const onNetworkChange = (callback: (online: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// ============================================
// 6. GEOLOCATION API - User location
// ============================================
export const getLocation = (): Promise<GeolocationPosition | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
};

// ============================================
// 7. VIBRATION API - Haptic feedback
// ============================================
export const vibrate = (pattern: number | number[] = 50): boolean => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    return navigator.vibrate(pattern);
  }
  return false;
};

// ============================================
// 8. BATTERY API - Battery status
// ============================================
export const getBatteryInfo = async (): Promise<{
  level: number;
  charging: boolean;
} | null> => {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return {
        level: battery.level * 100,
        charging: battery.charging,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// ============================================
// 9. VISIBILITY API - Tab visibility
// ============================================
export const onVisibilityChange = (callback: (visible: boolean) => void): (() => void) => {
  const handler = () => callback(!document.hidden);
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
};

// ============================================
// 10. LOCAL STORAGE with expiry
// ============================================
export const setWithExpiry = (key: string, value: any, ttlMs: number): void => {
  const item = {
    value,
    expiry: Date.now() + ttlMs,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = <T>(key: string): T | null => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  
  try {
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value as T;
  } catch {
    return null;
  }
};

// ============================================
// 11. WAKE LOCK API - Keep screen on
// ============================================
let wakeLock: any = null;

export const requestWakeLock = async (): Promise<boolean> => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Wake lock failed:', error);
    return false;
  }
};

export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
};

// ============================================
// 12. MEDIA DEVICES - Camera access
// ============================================
export const getCameraStream = async (): Promise<MediaStream | null> => {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // Prefer back camera
      audio: false,
    });
  } catch (error) {
    console.error('Camera access failed:', error);
    return null;
  }
};

export const capturePhoto = (video: HTMLVideoElement): string | null => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Photo capture failed:', error);
    return null;
  }
};
