import "server-only";
import { db } from "@/lib/db";

export const rateLimitRepository = {
  async consume(key: string, expiresAt: Date) {
    await db.authRateLimit.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return db.authRateLimit.upsert({
      where: { key },
      create: { key, expiresAt },
      update: { attempts: { increment: 1 } },
    });
  },
};
