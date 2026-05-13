import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { UserProfile } from '@/lib/types';

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
    },
  });
  (useAuth as jest.Mock).mockReturnValue({ userId: 'user-123', isSignedIn: true });
});

describe('useUserProfile', () => {
  it('returns null instead of throwing when the profile endpoint responds with 404', async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error('API request failed: 404 Not Found'));
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useUserProfile(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("caches the current user's profile under the 'me' key and fetches /api/users/me/profile", async () => {
    const profile: UserProfile = {
      id: 'p-1',
      userId: 'user-123',
      displayName: 'Alice',
      bio: null,
      avatarUrl: null,
    };
    const mockGet = jest.fn().mockResolvedValue(profile);
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useUserProfile(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith('/api/users/me/profile');
    expect(queryClient.getQueryData(['userProfile', 'me'])).toEqual(profile);
  });

  it("caches another user's profile under their userId and fetches the correct endpoint", async () => {
    const profile: UserProfile = {
      id: 'p-2',
      userId: 'user-456',
      displayName: 'Bob',
      bio: null,
      avatarUrl: null,
    };
    const mockGet = jest.fn().mockResolvedValue(profile);
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useUserProfile('user-456'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith('/api/users/user-456/profile');
    expect(queryClient.getQueryData(['userProfile', 'user-456'])).toEqual(profile);
  });
});
