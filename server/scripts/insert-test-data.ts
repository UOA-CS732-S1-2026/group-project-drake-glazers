import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { randomBytes } from 'crypto';

const userId = 'user_3DZYUD1Dv3UaRPSPt1KqUXbaTZJ';
const testToken = 'test_expo_token_' + randomBytes(4).toString('hex');

// Delete old test data
await prisma.memory.deleteMany({ where: { title: 'Anniversary Test Memory' } });
await prisma.deviceToken.deleteMany({ where: { token: { startsWith: 'test_expo_token_' } } });

// Create device token
const deviceToken = await prisma.deviceToken.create({
  data: {
    userId,
    token: testToken,
    platform: 'android',
    timeZone: 'Pacific/Auckland',
  },
});

console.log('✓ Created device token:', deviceToken.token);

// Create memory on May 12, 2024 in UTC (2 years ago, same month/day as today May 12, 2026)
const memory = await prisma.memory.create({
  data: {
    userId,
    title: 'Anniversary Test Memory',
    description: 'Testing anniversary notifications',
    latitude: -37.7,
    longitude: 174.8,
    visibility: 'private',
    createdAt: new Date(Date.UTC(2024, 4, 12, 0, 0, 0)), // May 12, 2024 UTC
  },
});

console.log('✓ Created memory:', memory.id, 'from', memory.createdAt.toISOString());

await prisma.$disconnect();
console.log('✓ Test data ready - run anniversary job now');
