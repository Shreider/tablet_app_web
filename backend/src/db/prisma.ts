import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '../config/env.js';

const appPool = new Pool({
  connectionString: env.databaseUrl
});

const adminPool =
  env.databaseAdminUrl === env.databaseUrl
    ? appPool
    : new Pool({
        connectionString: env.databaseAdminUrl
      });

const appAdapter = new PrismaPg(appPool);
const adminAdapter = env.databaseAdminUrl === env.databaseUrl ? appAdapter : new PrismaPg(adminPool);

export const prisma = new PrismaClient({
  adapter: appAdapter
});

export const prismaAdmin =
  env.databaseAdminUrl === env.databaseUrl ? prisma : new PrismaClient({ adapter: adminAdapter });

export const closePrismaClients = async () => {
  const closeAdminPool = async () => {
    if (adminPool !== appPool) {
      await adminPool.end();
    }
  };

  if (prismaAdmin !== prisma) {
    await Promise.all([prisma.$disconnect(), prismaAdmin.$disconnect(), appPool.end(), closeAdminPool()]);
    return;
  }

  await Promise.all([prisma.$disconnect(), appPool.end()]);
};
