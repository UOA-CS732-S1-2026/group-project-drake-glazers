import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';
import { Memory } from '@/lib/types';

export function useMemories() {
  const api = useApiClient();

  return useQuery<Memory[]>({
    queryKey: ['memories'],
    queryFn: () => api.get('/api/memories'),
  });
}
