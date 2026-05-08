import { useMutation } from '@tanstack/react-query';
import { uploadFile, useApiClient } from '@/lib/api';

type AvatarUploadInput = {
  uri: string;
  extension: string;
};

export function useUploadAvatar() {
  const api = useApiClient();

  return useMutation({
    mutationFn: async ({ uri, extension }: AvatarUploadInput): Promise<string> => {
      const { signedUrl, publicUrl } = await api.post('/api/media/avatar-url', {
        fileExtension: extension,
      });

      await uploadFile(signedUrl, uri, `image/${extension}`);

      return publicUrl;
    },
  });
}
