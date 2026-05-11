import { beforeEach } from 'vitest';
import { prisma } from '../lib/prisma.js';

beforeEach(async () => {
  // Delete in dependency order to avoid FK constraint errors
  await prisma.media.deleteMany();
  await prisma.listItem.deleteMany();
  await prisma.list.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.block.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
});
