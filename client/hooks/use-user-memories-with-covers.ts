import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import { MemoryWithCover } from '@/lib/types';

export function useUserMemoriesWithCovers(userId: string) {
  const { userId: myId } = useAuth();
  const api = useApiClient();

  return useQuery<MemoryWithCover[]>({
    queryKey: ['memories', 'user', userId, 'with-covers'],
    queryFn: () => api.get(`/api/users/${userId}/memories/with-covers`),
    enabled: !!userId && !!myId,
  });
}
