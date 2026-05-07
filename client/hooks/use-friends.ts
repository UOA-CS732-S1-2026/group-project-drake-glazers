import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';

export interface FriendUser {
  id: string;
  name: string;
  avatar: string;
  requestId?: string;
}

function mapFriend(item: any): FriendUser {
  return {
    id: item.friend.id,
    name: item.friend.profile?.displayName ?? item.friend.id,
    avatar: item.friend.profile?.avatarUrl ?? '',
  };
}

function mapRequest(item: any, direction: 'incoming' | 'outgoing'): FriendUser {
  const profile = direction === 'incoming' ? item.fromUser?.profile : item.toUser?.profile;
  const userId = direction === 'incoming' ? item.fromUserId : item.toUserId;
  return {
    id: userId,
    name: profile?.displayName ?? userId,
    avatar: profile?.avatarUrl ?? '',
    requestId: item.id,
  };
}

function mapBlock(item: any): FriendUser {
  return {
    id: item.blocked.id,
    name: item.blocked.profile?.displayName ?? item.blocked.id,
    avatar: item.blocked.profile?.avatarUrl ?? '',
  };
}

export function useFriends() {
  const { userId } = useAuth();
  const api = useApiClient();

  const friendsQuery = useQuery<FriendUser[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const data = await api.get('/api/friends');
      return data.map(mapFriend);
    },
    enabled: !!userId,
  });

  const requestsQuery = useQuery<{ incoming: FriendUser[]; outgoing: FriendUser[] }>({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const data = await api.get('/api/friend-requests');
      return {
        incoming: data.incoming.map((r: any) => mapRequest(r, 'incoming')),
        outgoing: data.outgoing.map((r: any) => mapRequest(r, 'outgoing')),
      };
    },
    enabled: !!userId,
  });

  const blocksQuery = useQuery<FriendUser[]>({
    queryKey: ['blocks'],
    queryFn: async () => {
      const data = await api.get('/api/blocks');
      return data.map(mapBlock);
    },
    enabled: !!userId,
  });

  const loading = friendsQuery.isLoading || requestsQuery.isLoading || blocksQuery.isLoading;
  const error =
    friendsQuery.error || requestsQuery.error || blocksQuery.error
      ? 'Failed to load friends data.'
      : null;

  return {
    friends: friendsQuery.data ?? [],
    incoming: requestsQuery.data?.incoming ?? [],
    outgoing: requestsQuery.data?.outgoing ?? [],
    blocked: blocksQuery.data ?? [],
    loading,
    error,
  };
}
