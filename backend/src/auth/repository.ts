import type { Locale, PublicUser } from '../../../shared/src/contracts.js';
export type Account = PublicUser & { passwordHash: string; status: string };
export type SessionRecord = {
  tokenHash: string;
  userId: string | null;
  expiresAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
};
export type NewAccount = {
  email: string;
  displayName: string;
  passwordHash: string;
  locale: Locale;
  marketingOptIn: boolean;
};
export interface AuthRepository {
  findAccount(email: string): Promise<Account | null>;
  getAccount(id: string): Promise<Account | null>;
  createAccount(data: NewAccount, requestId: string): Promise<Account>;
  updateProfile(
    id: string,
    data: { displayName: string; locale: Locale },
    requestId: string,
  ): Promise<Account>;
  getSession(hash: string): Promise<SessionRecord | null>;
  rotateSession(
    oldHash: string | null,
    session: SessionRecord,
    action: string,
    requestId: string,
  ): Promise<void>;
  touchSession(hash: string, now: Date): Promise<void>;
  revokeSession(hash: string, userId: string | null, requestId: string): Promise<void>;
  recordFailure(requestId: string): Promise<void>;
  consumeRate(key: string, expiresAt: Date): Promise<number>;
}
export class DuplicateAccountError extends Error {}
export function publicUser(account: Account): PublicUser {
  const { id, email, displayName, locale, permissions, emailVerified } = account;
  return { id, email, displayName, locale, permissions, emailVerified };
}
