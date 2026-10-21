/** Retry only MongoDB transaction/write conflicts. Never retry validation or auth errors. */
export function isMongoWriteConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: unknown; message?: unknown; meta?: { message?: unknown } };
  if (e.code === 'P2034') return true;
  const details = [e.message, e.meta?.message].filter(v => typeof v === 'string').join(' ');
  return /write conflict|deadlock|WriteConflict|TransientTransactionError/i.test(details);
}

export async function retryMongoWrite<T>(operation: () => Promise<T>, attempts = 5): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === attempts - 1 || !isMongoWriteConflict(error)) throw error;
      await new Promise<void>(resolve => setTimeout(resolve, Math.min(800, 60 * 2 ** attempt)));
    }
  }
  throw new Error('MongoDB write retry exhausted');
}
