import { describe, expect, it } from 'vitest';
import { gradeSpeech, tokenizeSpeech, bestSpeechAlternative } from './speech-score';

describe('speech-to-text feedback, not pronunciation grading', () => {
  it('ignores punctuation and capitalization', () => expect(gradeSpeech('Hello, how are you?', 'hello how are you').score).toBe(100));
  it('normalizes contractions', () => expect(gradeSpeech("I'm ready.", 'I am ready').score).toBe(100));
  it('penalizes missing and extra words', () => {
    expect(gradeSpeech('I am from Tashkent', 'I am from').score).toBe(75);
    expect(gradeSpeech('Nice to meet you', 'Nice to meet you today').score).toBe(75);
  });
  it('normalizes spoken and digit numbers', () => {
    expect(gradeSpeech('It costs two hundred som', 'it costs 200 song').score).toBe(100);
    expect(gradeSpeech('It costs two hundred som', 'it costs 200 thousand song').score).toBeLessThan(100);
    expect(gradeSpeech('I need twenty five tickets', 'I need 25 tickets').score).toBe(100);
    expect(gradeSpeech('One hundred and ten', '110').score).toBe(100);
  });
  it('does not convert ordinary song when no currency is referenced', () => {
    expect(gradeSpeech('I love this song', 'I love this som').score).toBeLessThan(100);
  });
  it('uses best available speech recognition alternative', () => {
    const best = bestSpeechAlternative('Two hundred som', ['200 thousand song', '200 so am']);
    expect(best.transcript).toBe('200 so am'); expect(best.match.score).toBe(100);
  });
  it('provides honest different-word feedback', () => {
    const r = gradeSpeech('I can help you', 'I cannot help you');
    expect(r.missed).toEqual(['can']); expect(r.added).toEqual(['cannot']);
  });
  it('handles silence and empty reference', () => {
    expect(gradeSpeech('Speak now', '').score).toBe(0);
    expect(gradeSpeech('', 'something').score).toBe(0);
    expect(tokenizeSpeech('Hello, world!')).toEqual(['hello', 'world']);
  });
});
