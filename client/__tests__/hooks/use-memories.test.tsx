import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemories, useMemoryDetails } from '@/hooks/use-memories';

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
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  (useAuth as jest.Mock).mockReturnValue({ userId: 'user-123' });
});

describe('useMemories', () => {
  it('does not fetch when there is no authenticated user', async () => {
    (useAuth as jest.Mock).mockReturnValue({ userId: null });
    const mockGet = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useMemories(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches from /api/memories when the user is authenticated', async () => {
    const memories = [{ id: 'm-1', title: 'Paris trip' }];
    const mockGet = jest.fn().mockResolvedValue(memories);
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useMemories(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(memories);
    expect(mockGet).toHaveBeenCalledWith('/api/memories');
  });

  it('exposes the error when the API call fails', async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error('API request failed: 500 Server Error'));
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useMemories(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('API request failed: 500 Server Error'));
    expect(result.current.data).toBeUndefined();
  });
});

describe('useMemoryDetails', () => {
  it('does not fetch when memoryId is undefined', async () => {
    const mockGet = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useMemoryDetails(undefined), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches from /api/memories/:id when both userId and memoryId are present', async () => {
    const memory = { id: 'm-42', title: 'Sunset hike' };
    const mockGet = jest.fn().mockResolvedValue(memory);
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useMemoryDetails('m-42'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(memory);
    expect(mockGet).toHaveBeenCalledWith('/api/memories/m-42');
  });
});
