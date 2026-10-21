import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword } from '../src/auth/crypto.js';
if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true')
  throw new Error('Demo seed disabled. Requires non-production NODE_ENV and ALLOW_DEMO_SEED=true.');
const values = z
  .object({
    DEMO_STUDENT_EMAIL: z.string().email(),
    DEMO_STUDENT_PASSWORD: z.string().min(16),
    DEMO_ADMIN_EMAIL: z.string().email(),
    DEMO_ADMIN_PASSWORD: z.string().min(16),
  })
  .parse(process.env);
if (values.DEMO_STUDENT_EMAIL.toLowerCase() === values.DEMO_ADMIN_EMAIL.toLowerCase())
  throw new Error('Use distinct demo addresses');
const db = new PrismaClient();
try {
  for (const [email, password, name, roleName] of [
    [values.DEMO_STUDENT_EMAIL, values.DEMO_STUDENT_PASSWORD, 'Demo student', 'STUDENT'],
    [values.DEMO_ADMIN_EMAIL, values.DEMO_ADMIN_PASSWORD, 'Demo administrator', 'ADMIN'],
  ]) {
    const normalized = email!.toLowerCase();
    if (await db.user.findUnique({ where: { email: normalized } }))
      throw new Error('Demo address already exists. Refusing to alter an existing account.');
    const role = await db.role.findUniqueOrThrow({ where: { name: roleName! } });
    await db.user.create({
      data: {
        email: normalized,
        passwordHash: await hashPassword(password!),
        displayName: name!,
        termsAcceptedAt: new Date(),
        termsVersion: 'development-only',
        userRole_user: { create: { roleId: role.id } },
      },
    });
  }
  console.info('Two development accounts created using supplied credentials.');
} finally {
  await db.$disconnect();
}
