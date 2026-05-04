import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import type { UserProfile } from '@/lib/types';

type UpsertProfileData = {
  displayName?: string;
  bio?: string;
};

export function useUserProfile() {
  const api = useApiClient();
  const { isSignedIn } = useAuth();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile'],
    enabled: !!isSignedIn,
    queryFn: async () => {
      try {
        return await api.get('/api/users/me/profile');
      } catch (error) {
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
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}
