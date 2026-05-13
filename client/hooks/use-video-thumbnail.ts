import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// Module-level cache so the same video URL is only extracted once per session.
const cache = new Map<string, string>();

export function useVideoThumbnail(videoUri: string | null | undefined): string | null {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(
    videoUri ? (cache.get(videoUri) ?? null) : null
  );

  useEffect(() => {
    if (!videoUri || Platform.OS === 'web') return;

    if (cache.has(videoUri)) {
      setThumbnailUri(cache.get(videoUri)!);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        let mod: typeof import('expo-video-thumbnails');
        try {
          mod = await import('expo-video-thumbnails');
        } catch {
          // Native module unavailable (e.g. Expo Go) — skip silently
          return;
        }
        const { uri } = await mod.getThumbnailAsync(videoUri, { time: 0, quality: 0.7 });
        if (!cancelled) {
          cache.set(videoUri, uri);
          setThumbnailUri(uri);
        }
      } catch {
        // network error or unsupported format — caller falls back to placeholder
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoUri]);

  return thumbnailUri;
}
