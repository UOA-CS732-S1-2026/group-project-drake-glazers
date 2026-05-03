import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

type DeviceToken = {
  userId: string;
  token: string;
  timeZone: string | null;
};

type MemorySummary = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
};

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  data: { memoryId: string };
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const ANNIVERSARY_NOTIFICATION_HOUR = Number(process.env.ANNIVERSARY_NOTIFICATION_HOUR ?? '9');

const chunkArray = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const safeTimeZone = (timeZone: string | null | undefined): string => {
  if (!timeZone) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return 'UTC';
  }
};

const getZonedDateParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const lookup = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.get('year')),
    month: Number(lookup.get('month')),
    day: Number(lookup.get('day')),
    hour: Number(lookup.get('hour')),
  };
};

const fetchDeviceTokens = async (): Promise<DeviceToken[]> => {
  return prisma.deviceToken.findMany({
    select: {
      userId: true,
      token: true,
      timeZone: true,
    },
  });
};

const fetchMemoriesForUsers = async (
  userIds: string[],
  month: number,
  day: number
): Promise<MemorySummary[]> => {
  if (userIds.length === 0) return [];

  return prisma.$queryRaw<MemorySummary[]>`
    SELECT id, "userId", title, "createdAt"
    FROM "Memory"
    WHERE "userId" IN (${Prisma.join(userIds)})
      AND EXTRACT(MONTH FROM "createdAt") = ${month}
      AND EXTRACT(DAY FROM "createdAt") = ${day}
  `;
};

const sendExpoNotifications = async (messages: ExpoMessage[]) => {
  const invalidTokens: string[] = [];

  for (const chunk of chunkArray(messages, 100)) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Expo push request failed', response.status, text);
      continue;
    }

    const payload = (await response.json()) as {
      data?: Array<{ status: string; details?: { error?: string } }>;
    };

    payload.data?.forEach((ticket, index) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        const token = chunk[index]?.to;
        if (token) {
          invalidTokens.push(token);
        }
      }
    });
  }

  if (invalidTokens.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { token: { in: invalidTokens } },
    });
  }
};

const run = async () => {
  const deviceTokens = await fetchDeviceTokens();

  if (deviceTokens.length === 0) {
    console.log('No device tokens registered.');
    return;
  }

  const tokensByZone = new Map<string, DeviceToken[]>();

  for (const token of deviceTokens) {
    const timeZone = safeTimeZone(token.timeZone);
    const group = tokensByZone.get(timeZone) ?? [];
    group.push(token);
    tokensByZone.set(timeZone, group);
  }

  const now = new Date();
  const messages: ExpoMessage[] = [];

  for (const [timeZone, tokens] of tokensByZone.entries()) {
    const nowParts = getZonedDateParts(now, timeZone);

    if (nowParts.hour !== ANNIVERSARY_NOTIFICATION_HOUR) {
      continue;
    }

    const tokensByUser = new Map<string, DeviceToken[]>();
    for (const token of tokens) {
      const list = tokensByUser.get(token.userId) ?? [];
      list.push(token);
      tokensByUser.set(token.userId, list);
    }

    const userIds = Array.from(tokensByUser.keys());
    const memories = await fetchMemoriesForUsers(userIds, nowParts.month, nowParts.day);

    for (const memory of memories) {
      const memoryParts = getZonedDateParts(memory.createdAt, timeZone);

      if (memoryParts.year >= nowParts.year) {
        continue;
      }

      const yearsAgo = nowParts.year - memoryParts.year;
      const memoryTokens = tokensByUser.get(memory.userId) ?? [];

      for (const token of memoryTokens) {
        messages.push({
          to: token.token,
          title: 'Memory Anniversary',
          body: `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago - "${memory.title}"`,
          data: { memoryId: memory.id },
        });
      }
    }
  }

  if (messages.length === 0) {
    console.log('No anniversary notifications to send.');
    return;
  }

  await sendExpoNotifications(messages);
  console.log(`Sent ${messages.length} anniversary notifications.`);
};

run()
  .catch((error) => {
    console.error('Anniversary notification job failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
