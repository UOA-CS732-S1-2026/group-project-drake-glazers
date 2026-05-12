import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  ...(datasourceUrl
    ? {
        datasource: {
          url: datasourceUrl,
          ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
        },
      }
    : {}),
  migrations: {
    path: 'prisma/migrations',
  },
});
