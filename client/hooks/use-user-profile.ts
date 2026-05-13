import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import type { UserProfile } from '@/lib/types';

type UpsertProfileData = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
};

export function useUserProfile(userId?: string) {
  const { userId: myId, isSignedIn } = useAuth();
  const api = useApiClient();
  const isOwn = !userId || userId === myId;
  const targetId = isOwn ? myId : userId;

  return useQuery<UserProfile | null>({
    // Separate cache keys for the current user vs other profiles.
    queryKey: ['userProfile', isOwn ? 'me' : targetId],
    enabled: isOwn ? !!isSignedIn : !!targetId,
    queryFn: async () => {
      try {
        const path = isOwn ? '/api/users/me/profile' : `/api/users/${targetId}/profile`;
        return await api.get(path);
      } catch (error) {
        // Treat missing profiles as empty state rather than a hard error.
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        throw error;
      }
    },
  });
}

export function useUpsertUserProfile() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertProfileData): Promise<UserProfile> =>
      api.put('/api/users/me/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', 'me'] });
    },
  });
}
