export type List = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  coverImages: string[];
};

export type ListItem = {
  id: string;
  listId: string;
  latitude: number;
  longitude: number;
  placeName: string | null;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export type User = {
  id: string; // same value as Clerk authUserId
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type FriendUser = {
  id: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

export type Friendship = {
  id: string;
  createdAt: string;
  friend: FriendUser;
};

export type FriendRequestUser = {
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

export type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fromUser: FriendRequestUser;
  toUser: FriendRequestUser;
};

export type FriendRequestsResponse = {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

export type BlockEntry = {
  id: string;
  createdAt: string;
  blocked: FriendUser;
};

export type SearchUser = {
  id: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
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
  memoryDate?: string | null;
  thumbnailUrl?: string | null;
  thumbnailMediaType?: 'image' | 'video' | null;
  createdAt: string;
  updatedAt: string;
};

export type MemoryWithCover = Memory & {
  coverImage: string | null;
};

export type ExploreMemory = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  relativeArea: string | null;
  latitude: number;
  longitude: number;
  visibility: string;
  createdAt: string;
  author: string;
  avatarUrl: string | null;
  imageUrl: string | null;
  mediaType: string | null;
};

export type SavedCollection = {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  count: number;
  coverImages: string[];
};

export type SavedPair = {
  memoryId: string;
  collectionId: string;
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
