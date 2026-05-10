import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import type { List, ListItem } from '@/lib/types';

export function useLists() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<List[]>({
    queryKey: ['lists'],
    queryFn: () => api.get('/api/lists'),
    enabled: !!userId,
  });
}

export function useList(id: string) {
  const api = useApiClient();

  return useQuery<List>({
    queryKey: ['lists', id],
    queryFn: () => api.get(`/api/lists/${id}`),
    enabled: !!id,
  });
}

export function useListItems(listId: string) {
  const api = useApiClient();

  return useQuery<ListItem[]>({
    queryKey: ['lists', listId, 'items'],
    queryFn: () => api.get(`/api/lists/${listId}/items`),
    enabled: !!listId,
  });
}

export function useCreateList() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; description?: string }) => api.post('/api/lists', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });
}

export function useUpdateList(id: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name?: string; description?: string }) => api.put(`/api/lists/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['lists', id] });
    },
  });
}

export function useDeleteList() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/lists/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData(['lists', id], null);
      queryClient.setQueryData(['lists', id, 'items'], []);
      queryClient.invalidateQueries({ queryKey: ['lists'], exact: true });
    },
  });
}

export function useCreateListItem(listId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { latitude: number; longitude: number; placeName?: string; notes?: string; imagePath?: string }) =>
      api.post(`/api/lists/${listId}/items`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', listId, 'items'] }),
  });
}

export function useUpdateListItem(listId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: { notes?: string; imagePath?: string } }) =>
      api.put(`/api/lists/${listId}/items/${itemId}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', listId, 'items'] }),
  });
}

export function useDeleteListItem(listId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/api/lists/${listId}/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', listId, 'items'] }),
  });
}
