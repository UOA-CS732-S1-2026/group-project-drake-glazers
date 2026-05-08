import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import type { List, ListItem } from '@/lib/types';

export function useLists() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<List[]>({
    queryKey: ['lists'],
    queryFn: () => api.get('/lists'),
    enabled: !!userId,
  });
}

export function useList(id: string) {
  const api = useApiClient();

  return useQuery<List>({
    queryKey: ['lists', id],
    queryFn: () => api.get(`/lists/${id}`),
    enabled: !!id,
  });
}

export function useListItems(listId: string) {
  const api = useApiClient();

  return useQuery<ListItem[]>({
    queryKey: ['lists', listId, 'items'],
    queryFn: () => api.get(`/lists/${listId}/items`),
    enabled: !!listId,
  });
}

export function useCreateList() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; description?: string }) => api.post('/lists', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });
}

export function useUpdateList(id: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name?: string; description?: string }) => api.put(`/lists/${id}`, body),
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
    mutationFn: (id: string) => api.delete(`/lists/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });
}

export function useCreateListItem(listId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { latitude: number; longitude: number; notes?: string }) =>
      api.post(`/lists/${listId}/items`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', listId, 'items'] }),
  });
}

export function useUpdateListItem(listId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: { notes?: string } }) =>
      api.put(`/lists/${listId}/items/${itemId}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', listId, 'items'] }),
  });
}

export function useDeleteListItem(listId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/lists/${listId}/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists', listId, 'items'] }),
  });
}
