import { PrismaClient } from "@prisma/client";

declare global {
  // Глобальный кеш нужен в dev-режиме, чтобы hot reload не плодил Prisma-подключения.
  // eslint-disable-next-line no-var -- объявление глобального var требуется для расширения globalThis.
  var __trackerPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__trackerPrisma__ ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__trackerPrisma__ = prisma;
}

export * from "@prisma/client";
