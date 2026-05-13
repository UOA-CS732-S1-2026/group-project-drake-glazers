import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUserSearch,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useBlockUser,
} from '@/hooks/use-friends';

jest.mock('@clerk/expo', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({ useApiClient: jest.fn() }));

import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';

let queryClient: QueryClient;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  (useAuth as jest.Mock).mockReturnValue({ userId: 'user-123' });
});

describe('useUserSearch', () => {
  it('does not fetch when the query string is empty', async () => {
    const mockGet = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useUserSearch(''), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('does not fetch when userId is absent even with a non-empty query', async () => {
    (useAuth as jest.Mock).mockReturnValue({ userId: null });
    const mockGet = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useUserSearch('alice'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches with the encoded query when userId and query are both present', async () => {
    const users = [{ id: 'u-1', profile: { displayName: 'Alice', avatarUrl: null } }];
    const mockGet = jest.fn().mockResolvedValue(users);
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useUserSearch('alice'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(users);
    expect(mockGet).toHaveBeenCalledWith('/api/users/search?q=alice');
  });
});

describe('useSendFriendRequest', () => {
  it('posts to /api/friend-requests and invalidates the friend-requests cache', async () => {
    const mockPost = jest.fn().mockResolvedValue({ id: 'fr-1' });
    (useApiClient as jest.Mock).mockReturnValue({ post: mockPost });

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSendFriendRequest(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('user-456');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPost).toHaveBeenCalledWith('/api/friend-requests', { toUserId: 'user-456' });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['friend-requests'] })
    );
  });
});

describe('useAcceptFriendRequest', () => {
  it('invalidates both friend-requests and friends caches on success', async () => {
    const mockPut = jest.fn().mockResolvedValue({ status: 'accepted' });
    (useApiClient as jest.Mock).mockReturnValue({ put: mockPut });

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAcceptFriendRequest(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('fr-99');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPut).toHaveBeenCalledWith('/api/friend-requests/fr-99/accept', {});
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['friend-requests'] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['friends'] }));
  });
});

describe('useBlockUser', () => {
  it('invalidates blocks, friends, and friend-requests caches on success', async () => {
    const mockPost = jest.fn().mockResolvedValue({ id: 'block-1' });
    (useApiClient as jest.Mock).mockReturnValue({ post: mockPost });

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBlockUser(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('user-456');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPost).toHaveBeenCalledWith('/api/blocks', { blockedId: 'user-456' });
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['blocks'] }));
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['friends'] }));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['friend-requests'] })
    );
  });
});
