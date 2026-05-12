import supertest from 'supertest';
export declare const request: import("supertest/lib/agent.js")<supertest.SuperTestStatic.Test>;
export declare const authed: (userId: string) => import("supertest/lib/agent.js")<supertest.SuperTestStatic.Test>;
export declare function seedUser(id: string, email: string): Promise<{
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function seedMemory(userId: string, overrides?: Partial<{
    title: string;
    visibility: 'public' | 'friends_only' | 'private';
    latitude: number;
    longitude: number;
}>): Promise<{
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    title: string;
    relativeArea: string | null;
    latitude: number;
    longitude: number;
    visibility: import("@prisma/client").$Enums.Visibility;
}>;
export declare function seedFriendship(userAId: string, userBId: string): Promise<{
    id: string;
    createdAt: Date;
    userBId: string;
    userAId: string;
}>;
export declare function seedFriendRequest(fromUserId: string, toUserId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    toUserId: string;
    fromUserId: string;
    status: import("@prisma/client").$Enums.FriendRequestStatus;
}>;
export declare function seedBlock(blockerId: string, blockedId: string): Promise<{
    id: string;
    createdAt: Date;
    blockedId: string;
    blockerId: string;
}>;
export declare function seedList(userId: string, name?: string): Promise<{
    userId: string;
    id: string;
    createdAt: Date;
    name: string;
    description: string | null;
}>;
export declare function seedListItem(listId: string): Promise<{
    id: string;
    createdAt: Date;
    latitude: number;
    longitude: number;
    placeName: string | null;
    notes: string | null;
    imagePath: string | null;
    listId: string;
}>;
export declare function seedUserProfile(userId: string, displayName: string): Promise<{
    userId: string;
    id: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
}>;
export declare function seedMedia(memoryId: string, userId: string, filename?: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    memoryId: string;
    mediaPath: string;
    mediaType: import("@prisma/client").$Enums.MediaType;
}>;
//# sourceMappingURL=helpers.d.ts.map