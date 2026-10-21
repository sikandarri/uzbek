import { describe, expect, it } from 'vitest';
import { isMongoWriteConflict, retryMongoWrite } from '../src/mongo-retry.js';
describe('Mongo write-conflict retry', () => {
  it('recognizes P2034 write conflicts and retries', async () => {
    let calls = 0;
    const answer = await retryMongoWrite(async () => {
      if (++calls < 3) throw Object.assign(new Error('Write conflict'), { code: 'P2034' });
      return 'ok';
    });
    expect(answer).toBe('ok');
    expect(calls).toBe(3);
  });
  it('does not retry unique constraint or non-transient errors', async () => {
    let calls = 0;
    await expect(retryMongoWrite(async () => {
      ++calls; throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    })).rejects.toThrow('Unique constraint');
    expect(calls).toBe(1);
    expect(isMongoWriteConflict(new Error('timeout'))).toBe(false);
  });
  it('stops after limited retries', async () => {
    let calls = 0;
    await expect(retryMongoWrite(async () => {
      ++calls; throw Object.assign(new Error('write conflict or a deadlock'), { code: 'P2034' });
    }, 2)).rejects.toThrow('write conflict');
    expect(calls).toBe(2);
  });
});
