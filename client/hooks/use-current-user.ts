import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import { User } from '@/lib/types';

/*
  Usage example:
    const { data: user, isLoading } = useCurrentUser();

    if (isLoading) return <ActivityIndicator />;

    // user.id is both the DB user ID and the Clerk authUserId (same value)
    console.log(user.id);     // e.g. "user_2xyz..."
    console.log(user.email);  // e.g. "dave@example.com"
*/

export function useCurrentUser() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<User>({
    queryKey: ['users', 'me'],
    queryFn: () => api.get('/api/users/me'),
    enabled: !!userId,
  });
}
