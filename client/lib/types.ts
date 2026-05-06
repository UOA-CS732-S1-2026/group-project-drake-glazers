export type User = {
  id: string; // same value as Clerk authUserId
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Visibility = 'public' | 'friends_only' | 'private';

export type UserProfile = {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type Memory = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  relativeArea?: string | null;
  latitude: number;
  longitude: number;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
};

export type MediaType = 'image' | 'video' | 'voice_note';

export type Media = {
  id: string;
  memoryId: string;
  mediaPath: string;
  mediaType: MediaType;
  createdAt: string;
  updatedAt: string;
  signedUrl?: string | null;
};
