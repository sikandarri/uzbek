import { describe, it, expect } from 'vitest';
import { alphabet, numbers, phraseGroups, usefulWordGroups, vocabularyGroups, englishNumber, uzbekNumber } from './essentials';

describe('Uzbek learning essentials', () => {
  it('covers the English alphabet and common numbers', () => {
    expect(alphabet).toHaveLength(26);
    expect(numbers.filter(x => x.n >= 0 && x.n <= 100)).toHaveLength(101);
    expect(englishNumber(200)).toBe('two hundred');
    expect(uzbekNumber(200)).toBe('ikki yuz');
  });
  it('has translated and distinct reference content', () => {
    const phrases = phraseGroups.flatMap(x => x.words);
    const useful = usefulWordGroups.flatMap(x => x.words);
    const everyday = vocabularyGroups.flatMap(x => x.words);
    expect(phrases).toHaveLength(120);
    expect(useful).toHaveLength(80);
    expect(everyday).toHaveLength(132);
    for (const group of [phrases,useful,everyday]) {
      expect(new Set(group.map(item=>item.en.toLowerCase())).size).toBe(group.length);
      expect(group.every(item=>Boolean(item.en.trim() && item.uz.trim()))).toBe(true);
    }
    expect(useful.some(w=>everyday.some(v=>w.en.toLowerCase()===v.en.toLowerCase()))).toBe(false);
  });
});
