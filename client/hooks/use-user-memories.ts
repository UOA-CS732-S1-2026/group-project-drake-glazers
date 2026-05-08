import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import { Memory } from '@/lib/types';

export function useUserMemories(userId: string) {
  const { userId: myId } = useAuth();
  const api = useApiClient();

  return useQuery<Memory[]>({
    queryKey: ['memories', 'user', userId],
    queryFn: () => api.get(`/api/users/${userId}/memories`),
    enabled: !!userId && !!myId,
  });
}
