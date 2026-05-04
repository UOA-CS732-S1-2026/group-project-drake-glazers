import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';
import type { UserProfile } from '@/lib/types';

type UpsertProfileData = {
  displayName?: string;
  bio?: string;
};

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
