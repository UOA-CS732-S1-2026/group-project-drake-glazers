import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';

export type MediaItem = {
  id: string;
  memoryId: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'voice_note';
  signedUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useMemoryMedia(memoryId: string) {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<MediaItem[]>({
    queryKey: ['memories', memoryId, 'media'],
    queryFn: () => api.get(`/api/memories/${memoryId}/media`),
    enabled: !!userId && !!memoryId,
    retry: false,
  });
}
