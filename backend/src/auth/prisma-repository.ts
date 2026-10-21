import { Prisma, type PrismaClient } from '@prisma/client';
import { DuplicateAccountError, type Account, type AuthRepository } from './repository.js';
import { retryMongoWrite } from '../mongo-retry.js';
const include = {
  userRole_user: {
    include: { role: { include: { rolePermission_role: { include: { permission: true } } } } },
  },
} as const;
type Row = Prisma.UserGetPayload<{ include: typeof include }>;
function account(u: Row): Account {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    passwordHash: u.passwordHash,
    status: u.deletedAt ? 'DELETED' : u.status,
    locale: u.locale === 'UZ' ? 'uz-Latn' : 'en',
    emailVerified: !!u.emailVerifiedAt,
    permissions: [
      ...new Set(
        u.userRole_user.flatMap((r) => r.role.rolePermission_role.map((p) => p.permission.code)),
      ),
    ],
  };
}
export function prismaAuth(db: PrismaClient): AuthRepository {
  return {
    async findAccount(email) {
      const u = await db.user.findUnique({ where: { email }, include });
      return u ? account(u) : null;
    },
    async getAccount(id) {
      const u = await db.user.findUnique({ where: { id }, include });
      return u ? account(u) : null;
    },
    async createAccount(data, requestId) {
      try {
        return await retryMongoWrite(() => db.$transaction(async (tx) => {
          const role = await tx.role.findUniqueOrThrow({ where: { name: 'STUDENT' } });
          const u = await tx.user.create({
            data: {
              ...data,
              locale: data.locale === 'en' ? 'EN' : 'UZ',
              termsAcceptedAt: new Date(),
              termsVersion: 'prelaunch-v1',
              userRole_user: { create: { roleId: role.id } },
            },
            include,
          });
          await tx.auditLog.create({
            data: {
              actorId: u.id,
              action: 'auth.register',
              resourceType: 'User',
              resourceId: u.id,
              requestId,
            },
          });
          return account(u);
        }));
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
          throw new DuplicateAccountError();
        throw e;
      }
    },
    async updateProfile(id, data, requestId) {
      return retryMongoWrite(() => db.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id },
          data: { ...data, locale: data.locale === 'en' ? 'EN' : 'UZ' },
          include,
        });
        await tx.auditLog.create({
          data: {
            actorId: id,
            action: 'profile.update',
            resourceType: 'User',
            resourceId: id,
            requestId,
          },
        });
        return account(u);
      }));
    },
    getSession(tokenHash) {
      return db.session.findUnique({ where: { tokenHash } });
    },
    async rotateSession(oldHash, session, action, requestId) {
      await retryMongoWrite(() => db.$transaction(async (tx) => {
        if (oldHash) await tx.session.deleteMany({ where: { tokenHash: oldHash } });
        await tx.session.create({ data: session });
        if (session.userId)
          await tx.auditLog.create({
            data: { actorId: session.userId, action, resourceType: 'Session', requestId },
          });
      }));
    },
    async touchSession(tokenHash, lastSeenAt) {
      await retryMongoWrite(() => db.session.updateMany({ where: { tokenHash, revokedAt: null }, data: { lastSeenAt } }));
    },
    async revokeSession(tokenHash, actorId, requestId) {
      await retryMongoWrite(() => db.$transaction(async (tx) => {
        await tx.session.deleteMany({ where: { tokenHash } });
        await tx.auditLog.create({
          data: { actorId, action: 'auth.logout', resourceType: 'Session', requestId },
        });
      }));
    },
    async recordFailure(requestId) {
      await db.auditLog.create({
        data: { action: 'auth.login.failed', resourceType: 'Session', requestId },
      });
    },
    async consumeRate(key, expiresAt) {
      const row = await retryMongoWrite(() => db.rateLimit.upsert({
        where: { key },
        create: { key, expiresAt, count: 1 },
        update: { count: { increment: 1 } },
      }));
      return row.count;
    },
  };
}
