export type User = {
  id: string; // same value as Clerk authUserId
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Memory = {
  id: string;
  userId: string;
  title: string;
  latitude: number;
  longitude: number;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
};
