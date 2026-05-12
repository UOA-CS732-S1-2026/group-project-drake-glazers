import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import type { Memory } from '@/lib/types';

export function useMemories() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<Memory[]>({
    queryKey: ['memories'],
    queryFn: () => api.get('/api/memories'),
    enabled: !!userId,
  });
}

export function useMemoryDetails(memoryId?: string) {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<Memory>({
    queryKey: ['memories', memoryId],
    queryFn: () => api.get(`/api/memories/${memoryId}`),
    enabled: !!userId && !!memoryId,
  });
}
