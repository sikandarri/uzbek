import 'dotenv/config';
import { prisma } from '../db.js';
const now = new Date();
try {
  const sessions = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { not: null } },
        { lastSeenAt: { lt: new Date(Date.now() - 86400_000) } },
      ],
    },
  });
  const rates = await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
  const tokens = await prisma.authToken.deleteMany({ where: { expiresAt: { lt: now } } });
  console.info({ sessions: sessions.count, rateLimits: rates.count, tokens: tokens.count });
} finally {
  await prisma.$disconnect();
}
