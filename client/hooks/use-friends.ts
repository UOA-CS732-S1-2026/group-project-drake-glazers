import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';

export type Friend = {
  id: string;
  createdAt: string;
  friend: {
    id: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
};

export function useFriends() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<Friend[]>({
    queryKey: ['friends'],
    queryFn: () => api.get('/api/friends'),
    enabled: !!userId,
  });
}
