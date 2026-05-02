export type User = {
  id: string; // same value as Clerk authUserId
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Visibility = 'public' | 'friends_only' | 'private';

export type Memory = {
  id: string;
  userId: string;
  title: string;
  latitude: number;
  longitude: number;
  visibility: Visibility;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaType = 'IMAGE' | 'VIDEO' | 'VOICE_NOTE';

export type Media = {
  id: string;
  memoryId: string;
  mediaPath: string;
  mediaType: MediaType;
  signedUrl?: string;
};
