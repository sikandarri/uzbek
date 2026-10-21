import { randomUUID } from 'node:crypto';
import {
  DuplicateAccountError,
  type Account,
  type AuthRepository,
  type SessionRecord,
} from '../src/auth/repository.js';
export function memoryRepository() {
  const accounts = new Map<string, Account>(),
    sessions = new Map<string, SessionRecord>(),
    rates = new Map<string, number>();
  const events: string[] = [];
  const repo: AuthRepository = {
    async findAccount(email) {
      return [...accounts.values()].find((u) => u.email === email) ?? null;
    },
    async getAccount(id) {
      return accounts.get(id) ?? null;
    },
    async createAccount(data) {
      if ([...accounts.values()].some((u) => u.email === data.email))
        throw new DuplicateAccountError();
      const a: Account = {
        ...data,
        id: randomUUID(),
        status: 'ACTIVE',
        permissions: ['learning.read'],
        emailVerified: false,
      };
      accounts.set(a.id, a);
      events.push('auth.register');
      return a;
    },
    async updateProfile(id, data) {
      const a = { ...accounts.get(id)!, ...data };
      accounts.set(id, a);
      events.push('profile.update');
      return a;
    },
    async getSession(hash) {
      return sessions.get(hash) ?? null;
    },
    async rotateSession(oldHash, s, action) {
      if (oldHash) sessions.delete(oldHash);
      sessions.set(s.tokenHash, s);
      events.push(action);
    },
    async touchSession(hash, now) {
      const s = sessions.get(hash);
      if (s) s.lastSeenAt = now;
    },
    async revokeSession(hash) {
      sessions.delete(hash);
      events.push('auth.logout');
    },
    async recordFailure() {
      events.push('auth.login.failed');
    },
    async consumeRate(key) {
      const n = (rates.get(key) ?? 0) + 1;
      rates.set(key, n);
      return n;
    },
  };
  return { repo, accounts, sessions, rates, events };
}
