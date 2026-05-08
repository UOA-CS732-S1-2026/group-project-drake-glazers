import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import type { Friendship, FriendRequestsResponse, BlockEntry, SearchUser } from '@/lib/types';

export function useFriends() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<Friendship[]>({
    queryKey: ['friends'],
    queryFn: () => api.get('/api/friends'),
    enabled: !!userId,
  });
}

export function useFriendRequests() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<FriendRequestsResponse>({
    queryKey: ['friend-requests'],
    queryFn: () => api.get('/api/friend-requests'),
    enabled: !!userId,
  });
}

export function useBlockedUsers() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<BlockEntry[]>({
    queryKey: ['blocks'],
    queryFn: () => api.get('/api/blocks'),
    enabled: !!userId,
  });
}

export function useUserSearch(query: string) {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<SearchUser[]>({
    queryKey: ['users', 'search', query],
    queryFn: () => api.get(`/api/users/search?q=${encodeURIComponent(query)}`),
    enabled: !!userId && query.trim().length > 0,
  });
}

export function useSendFriendRequest() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toUserId: string) => api.post('/api/friend-requests', { toUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.put(`/api/friend-requests/${id}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRejectFriendRequest() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.put(`/api/friend-requests/${id}/decline`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useCancelFriendRequest() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/friend-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useRemoveFriend() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.delete(`/api/friends/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useBlockUser() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedId: string) => api.post('/api/blocks', { blockedId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useUnblockUser() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.delete(`/api/blocks/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
}
