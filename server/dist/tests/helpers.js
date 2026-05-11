import supertest from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
export const request = supertest(app);
export const authed = (userId) => supertest.agent(app).set('x-dev-user-id', userId);
export async function seedUser(id, email) {
    return prisma.user.create({ data: { id, email } });
}
export async function seedMemory(userId, overrides = {}) {
    return prisma.memory.create({
        data: {
            userId,
            title: overrides.title ?? 'Test Memory',
            latitude: overrides.latitude ?? 0,
            longitude: overrides.longitude ?? 0,
            visibility: overrides.visibility ?? 'public',
        },
    });
}
export async function seedFriendship(userAId, userBId) {
    const [a, b] = [userAId, userBId].sort();
    return prisma.friendship.create({ data: { userAId: a, userBId: b } });
}
export async function seedFriendRequest(fromUserId, toUserId) {
    return prisma.friendRequest.create({
        data: { fromUserId, toUserId, status: 'pending' },
    });
}
export async function seedBlock(blockerId, blockedId) {
    return prisma.block.create({ data: { blockerId, blockedId } });
}
export async function seedList(userId, name = 'My List') {
    return prisma.list.create({ data: { userId, name } });
}
export async function seedListItem(listId) {
    return prisma.listItem.create({
        data: { listId, latitude: 1, longitude: 1 },
    });
}
export async function seedUserProfile(userId, displayName) {
    return prisma.userProfile.create({ data: { userId, displayName } });
}
export async function seedMedia(memoryId, userId, filename = 'test.jpg') {
    return prisma.media.create({
        data: { memoryId, mediaPath: `memories/${userId}/${filename}`, mediaType: 'image' },
    });
}
//# sourceMappingURL=helpers.js.map