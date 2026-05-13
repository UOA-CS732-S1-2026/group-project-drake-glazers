import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useList, useListItems, useDeleteList } from '@/hooks/use-lists';
import type { List, ListItem } from '@/lib/types';

jest.mock('@clerk/expo', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({ useApiClient: jest.fn() }));

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
});

describe('useList', () => {
  it('does not fetch when id is an empty string', async () => {
    const mockGet = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useList(''), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches the list without requiring auth when a valid id is provided', async () => {
    const list: List = {
      id: 'list-1',
      userId: 'user-123',
      name: 'Road trip',
      description: null,
      createdAt: '',
      coverImages: [],
    };
    const mockGet = jest.fn().mockResolvedValue(list);
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useList('list-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(list);
    expect(mockGet).toHaveBeenCalledWith('/api/lists/list-1');
  });
});

describe('useListItems', () => {
  it('does not fetch when listId is an empty string', async () => {
    const mockGet = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useListItems(''), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches list items without requiring auth when listId is provided', async () => {
    const items: ListItem[] = [
      {
        id: 'item-1',
        listId: 'list-1',
        latitude: -36.848,
        longitude: 174.763,
        placeName: 'Auckland',
        notes: null,
        imageUrl: null,
        createdAt: '',
      },
    ];
    const mockGet = jest.fn().mockResolvedValue(items);
    (useApiClient as jest.Mock).mockReturnValue({ get: mockGet });

    const { result } = renderHook(() => useListItems('list-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(items);
    expect(mockGet).toHaveBeenCalledWith('/api/lists/list-1/items');
  });
});

describe('useDeleteList', () => {
  it('nullifies the list entry, clears its items, and invalidates the lists collection', async () => {
    const mockDelete = jest.fn().mockResolvedValue(null);
    (useApiClient as jest.Mock).mockReturnValue({ delete: mockDelete });

    const list: List = {
      id: 'list-1',
      userId: 'u',
      name: 'A',
      description: null,
      createdAt: '',
      coverImages: [],
    };
    const item: ListItem = {
      id: 'i-1',
      listId: 'list-1',
      latitude: 0,
      longitude: 0,
      placeName: null,
      notes: null,
      imageUrl: null,
      createdAt: '',
    };
    queryClient.setQueryData<List>(['lists', 'list-1'], list);
    queryClient.setQueryData<ListItem[]>(['lists', 'list-1', 'items'], [item]);
    queryClient.setQueryData<List[]>(['lists'], [list]);

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteList(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('list-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(['lists', 'list-1'])).toBeNull();
    expect(queryClient.getQueryData(['lists', 'list-1', 'items'])).toEqual([]);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['lists'], exact: true })
    );
  });
});
