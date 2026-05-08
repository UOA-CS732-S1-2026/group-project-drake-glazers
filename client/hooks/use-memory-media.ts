import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import type { Media } from '@/lib/types';

export function useMemoryMedia(memoryId?: string) {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<Media[]>({
    queryKey: ['memories', memoryId, 'media'],
    queryFn: () => api.get(`/api/memories/${memoryId}/media`),
    enabled: !!userId && !!memoryId,
    retry: false,
  });
}
