import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSavedPairs,
  useSaveMemory,
  useUnsaveMemory,
  useDeleteCollection,
} from '@/hooks/use-saved';
import type { SavedCollection, SavedPair } from '@/lib/types';

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

describe('useSavedPairs', () => {
  it('fetches from /api/saved/memories and returns the data', async () => {
    const pairs: SavedPair[] = [{ collectionId: 'col-1', memoryId: 'mem-1' }];
    const mockGet = jest.fn().mockResolvedValue(pairs);
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useSavedPairs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(pairs);
    expect(mockGet).toHaveBeenCalledWith('/api/saved/memories');
  });

  it('does not fetch when userId is absent', async () => {
    (useAuth as jest.Mock).mockReturnValue({ userId: null });
    const mockGet = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useSavedPairs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('useSaveMemory — optimistic updates', () => {
  it('adds the pair to savedPairs cache before the API responds', async () => {
    // Use a never-resolving promise to keep the mutation in-flight
    const mockPost = jest.fn().mockReturnValue(new Promise(() => {}));
    (useApiClient as jest.Mock).mockReturnValue({ post: mockPost });

    queryClient.setQueryData<SavedPair[]>(['savedPairs'], []);

    const { result } = renderHook(() => useSaveMemory(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ collectionId: 'col-1', memoryId: 'mem-1' });
    });

    // onMutate is async (awaits cancelQueries), so we wait for the cache to update
    await waitFor(() => {
      const pairs = queryClient.getQueryData<SavedPair[]>(['savedPairs']);
      return Array.isArray(pairs) && pairs.length === 1;
    });

    const pairs = queryClient.getQueryData<SavedPair[]>(['savedPairs']);
    expect(pairs).toContainEqual({ collectionId: 'col-1', memoryId: 'mem-1' });
  });

  it('rolls back the optimistic update when the API call fails', async () => {
    const mockPost = jest.fn().mockRejectedValue(new Error('Network error'));
    (useApiClient as jest.Mock).mockReturnValue({ post: mockPost });

    const original: SavedPair[] = [{ collectionId: 'col-old', memoryId: 'mem-old' }];
    queryClient.setQueryData<SavedPair[]>(['savedPairs'], original);

    const { result } = renderHook(() => useSaveMemory(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ collectionId: 'col-new', memoryId: 'mem-new' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const pairs = queryClient.getQueryData<SavedPair[]>(['savedPairs']);
    expect(pairs).not.toContainEqual({ collectionId: 'col-new', memoryId: 'mem-new' });
    expect(pairs).toContainEqual({ collectionId: 'col-old', memoryId: 'mem-old' });
  });
});

describe('useUnsaveMemory — optimistic updates', () => {
  it('removes the pair from the cache before the API responds', async () => {
    const mockDelete = jest.fn().mockReturnValue(new Promise(() => {}));
    (useApiClient as jest.Mock).mockReturnValue({ delete: mockDelete });

    queryClient.setQueryData<SavedPair[]>(
      ['savedPairs'],
      [
        { collectionId: 'col-1', memoryId: 'mem-1' },
        { collectionId: 'col-2', memoryId: 'mem-2' },
      ]
    );

    const { result } = renderHook(() => useUnsaveMemory(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ collectionId: 'col-1', memoryId: 'mem-1' });
    });

    await waitFor(() => {
      const pairs = queryClient.getQueryData<SavedPair[]>(['savedPairs']);
      return Array.isArray(pairs) && pairs.length === 1;
    });

    const pairs = queryClient.getQueryData<SavedPair[]>(['savedPairs']);
    expect(pairs).not.toContainEqual({ collectionId: 'col-1', memoryId: 'mem-1' });
    expect(pairs).toContainEqual({ collectionId: 'col-2', memoryId: 'mem-2' });
  });
});

describe('useDeleteCollection — cache management', () => {
  it('removes the deleted collection and its saved pairs from the cache', async () => {
    const mockDelete = jest.fn().mockResolvedValue(null);
    (useApiClient as jest.Mock).mockReturnValue({ delete: mockDelete });

    queryClient.setQueryData<SavedCollection[]>(
      ['savedCollections'],
      [
        {
          id: 'col-1',
          name: 'Favourites',
          isDefault: false,
          createdAt: '',
          count: 1,
          coverImages: [],
        },
        { id: 'col-2', name: 'Travel', isDefault: false, createdAt: '', count: 2, coverImages: [] },
      ]
    );
    queryClient.setQueryData<SavedPair[]>(
      ['savedPairs'],
      [
        { collectionId: 'col-1', memoryId: 'mem-A' },
        { collectionId: 'col-2', memoryId: 'mem-B' },
      ]
    );

    const { result } = renderHook(() => useDeleteCollection(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('col-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const collections = queryClient.getQueryData<SavedCollection[]>(['savedCollections']);
    expect(collections).toHaveLength(1);
    expect(collections![0].id).toBe('col-2');

    const pairs = queryClient.getQueryData<SavedPair[]>(['savedPairs']);
    expect(pairs).not.toContainEqual({ collectionId: 'col-1', memoryId: 'mem-A' });
    expect(pairs).toContainEqual({ collectionId: 'col-2', memoryId: 'mem-B' });
  });
});
