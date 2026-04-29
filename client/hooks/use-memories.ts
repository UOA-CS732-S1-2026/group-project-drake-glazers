import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useMemories() {
  return useQuery({
    queryKey: ['memories'],
    queryFn: api.memories.list,
  });
}
