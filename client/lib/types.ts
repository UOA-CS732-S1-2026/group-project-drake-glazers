export type List = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export type ListItem = {
  id: string;
  listId: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  createdAt: string;
};

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
