import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/lib/api';
import type { SavedCollection, SavedPair, ExploreMemory } from '@/lib/types';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useSavedPairs() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<SavedPair[]>({
    queryKey: ['savedPairs'],
    queryFn: () => api.get('/api/saved/memories'),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useSavedCollections() {
  const { userId } = useAuth();
  const api = useApiClient();

  return useQuery<SavedCollection[]>({
    queryKey: ['savedCollections'],
    queryFn: () => api.get('/api/saved/collections'),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useCollectionMemories(collectionId: string) {
  const api = useApiClient();

  return useQuery<ExploreMemory[]>({
    queryKey: ['savedCollections', collectionId, 'memories'],
    queryFn: () => api.get(`/api/saved/collections/${collectionId}`),
    enabled: !!collectionId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSaveMemory() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, memoryId }: { collectionId: string; memoryId: string }) =>
      api.post(`/api/saved/collections/${collectionId}/memories`, { memoryId }),

    onMutate: async ({ collectionId, memoryId }) => {
      await queryClient.cancelQueries({ queryKey: ['savedPairs'] });
      const previous = queryClient.getQueryData<SavedPair[]>(['savedPairs']);
      queryClient.setQueryData<SavedPair[]>(['savedPairs'], (old = []) => [
        ...old,
        { memoryId, collectionId },
      ]);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['savedPairs'], context.previous);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCollections'] });
    },
  });
}

export function useUnsaveMemory() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, memoryId }: { collectionId: string; memoryId: string }) =>
      api.delete(`/api/saved/collections/${collectionId}/memories/${memoryId}`),

    onMutate: async ({ collectionId, memoryId }) => {
      await queryClient.cancelQueries({ queryKey: ['savedPairs'] });
      const previous = queryClient.getQueryData<SavedPair[]>(['savedPairs']);
      queryClient.setQueryData<SavedPair[]>(['savedPairs'], (old = []) =>
        old.filter((p) => !(p.collectionId === collectionId && p.memoryId === memoryId))
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['savedPairs'], context.previous);
      }
    },

    onSuccess: (_data, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['savedCollections'] });
      queryClient.invalidateQueries({
        queryKey: ['savedCollections', collectionId, 'memories'],
      });
    },
  });
}

export function useCreateCollection() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.post('/api/saved/collections', { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedCollections'] }),
  });
}

export function useDeleteCollection() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => api.delete(`/api/saved/collections/${collectionId}`),
    onSuccess: (_data, collectionId) => {
      queryClient.setQueryData<SavedCollection[]>(['savedCollections'], (old = []) =>
        old.filter((c) => c.id !== collectionId)
      );
      queryClient.setQueryData<SavedPair[]>(['savedPairs'], (old = []) =>
        old.filter((p) => p.collectionId !== collectionId)
      );
    },
  });
}
