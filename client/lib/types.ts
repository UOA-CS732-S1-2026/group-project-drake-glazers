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
