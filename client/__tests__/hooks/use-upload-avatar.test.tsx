import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUploadAvatar } from '@/hooks/use-upload-avatar';

jest.mock('@/lib/api', () => ({
  useApiClient: jest.fn(),
  uploadFile: jest.fn(),
}));

import { useApiClient, uploadFile } from '@/lib/api';

let queryClient: QueryClient;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
});

describe('useUploadAvatar', () => {
  it('fetches a signed URL, uploads the file, and returns the public URL', async () => {
    (useApiClient as jest.Mock).mockReturnValue({
      post: jest.fn().mockResolvedValue({
        signedUrl: 'https://storage.example.com/signed',
        publicUrl: 'https://cdn.example.com/avatar.jpg',
      }),
    });
    (uploadFile as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUploadAvatar(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ uri: 'file:///local/photo.jpg', extension: 'jpg' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const api = (useApiClient as jest.Mock).mock.results[0].value;
    expect(api.post).toHaveBeenCalledWith('/api/media/avatar-url', { fileExtension: 'jpg' });
    expect(uploadFile).toHaveBeenCalledWith(
      'https://storage.example.com/signed',
      'file:///local/photo.jpg',
      'image/jpg'
    );
    expect(result.current.data).toBe('https://cdn.example.com/avatar.jpg');
  });

  it('fails if uploadFile throws after the signed URL is fetched', async () => {
    (useApiClient as jest.Mock).mockReturnValue({
      post: jest.fn().mockResolvedValue({
        signedUrl: 'https://storage.example.com/signed',
        publicUrl: 'https://cdn.example.com/avatar.jpg',
      }),
    });
    (uploadFile as jest.Mock).mockRejectedValue(new Error('Upload failed: 403'));

    const { result } = renderHook(() => useUploadAvatar(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ uri: 'file:///local/photo.jpg', extension: 'jpg' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Upload failed: 403'));
  });

  it('does not call uploadFile if the signed URL request fails', async () => {
    (useApiClient as jest.Mock).mockReturnValue({
      post: jest.fn().mockRejectedValue(new Error('Unauthorized')),
    });
    (uploadFile as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUploadAvatar(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ uri: 'file:///local/photo.jpg', extension: 'jpg' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(uploadFile).not.toHaveBeenCalled();
  });
});
