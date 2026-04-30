import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import { Memory } from '@/lib/types';

export function useMemories() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<Memory[]>({
    queryKey: ['memories'],
    queryFn: () => api.get('/api/memories'),
    enabled: !!userId,
  });
}
