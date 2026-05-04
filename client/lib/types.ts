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

export type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
