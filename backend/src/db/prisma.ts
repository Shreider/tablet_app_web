import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.databaseUrl
    }
  }
});

export const prismaAdmin =
  env.databaseAdminUrl === env.databaseUrl
    ? prisma
    : new PrismaClient({
        datasources: {
          db: {
            url: env.databaseAdminUrl
          }
        }
      });

export const closePrismaClients = async () => {
  if (prismaAdmin !== prisma) {
    await Promise.all([prisma.$disconnect(), prismaAdmin.$disconnect()]);
    return;
  }

  await prisma.$disconnect();
};
