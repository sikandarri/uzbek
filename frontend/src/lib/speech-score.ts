/** Speech-to-text text matching, not an evaluation of actual pronunciation.
 * Normalize recognizer formatting only, never forgive genuinely different quantities. */
const NUMBER_UNITS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};
const NUMBER_MAGNITUDES: Record<string, number> = { thousand: 1000, million: 1000000 };

function collapseNumbers(tokens: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < tokens.length;) {
    const beginning = i;
    let chunk = 0, total = 0, sawNumber = false, sawScale = false;
    while (i < tokens.length) {
      const token = tokens[i]!;
      if (token === 'and' && sawNumber && sawScale && i + 1 < tokens.length &&
          (tokens[i + 1]! in NUMBER_UNITS || tokens[i + 1]! in NUMBER_MAGNITUDES)) { i++; continue; }
      if (token in NUMBER_UNITS) { chunk += NUMBER_UNITS[token]!; sawNumber = true; i++; continue; }
      if (token === 'hundred' && sawNumber) { chunk = (chunk || 1) * 100; sawScale = true; i++; continue; }
      if (token in NUMBER_MAGNITUDES && sawNumber) { total += (chunk || 1) * NUMBER_MAGNITUDES[token]!; chunk = 0; sawScale = true; i++; continue; }
      break;
    }
    if (sawNumber) result.push(String(total + chunk));
    else { result.push(tokens[beginning]!); i = beginning + 1; }
  }
  return result;
}

export function tokenizeSpeech(text: string, currencyContext = false): string[] {
  let expanded = text.toLowerCase()
    .replace(/[’‘ʻʼ]/g, "'")
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\b(\w+)'re\b/g, '$1 are')
    .replace(/\b(\w+)'ve\b/g, '$1 have')
    .replace(/\b(\w+)'ll\b/g, '$1 will')
    .replace(/\b(\w+)'m\b/g, '$1 am')
    .replace(/\b(\w+)n't\b/g, '$1 not')
    .replace(/\b(\w+)'s\b/g, '$1 is')
    .replace(/\b(\w+)'d\b/g, '$1 would');
  // Browsers sometimes render Uzbek so'm as "so am", "song", "sum" or "soum".
  // Only apply these aliases if the displayed reference itself contains this currency.
  if (currencyContext) {
    expanded = expanded.replace(/\bso\s+am\b|\bso\s+m\b|\bs[oó]um\b|\bsum\b|\bsong\b|\bsom\b|\bso'm\b/g, 'som');
  }
  return collapseNumbers(expanded.match(/[\p{L}\p{N}]+/gu) ?? []);
}

export type SpeechMatch = {
  score: number;
  correct: number;
  targetCount: number;
  substitutions: number;
  missed: string[];
  added: string[];
};

/** Minimum word edit distance after equivalent number and known currency spellings.
 * A different number (e.g. 200 vs 200,000) still loses marks. */
export function gradeSpeech(target: string, spoken: string): SpeechMatch {
  const currency = /\bso['’‘ʻʼ]?m\b|\bsom\b|\bso\s+am\b|\bsoum\b/i.test(target);
  const expected = tokenizeSpeech(target, currency);
  const actual = tokenizeSpeech(spoken, currency);
  const n = expected.length, m = actual.length;
  if (!n) return { score: 0, correct: 0, targetCount: 0, substitutions: 0, missed: [], added: actual };
  const dp = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i]![0] = i;
  for (let j = 0; j <= m; j++) dp[0]![j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) dp[i]![j] = Math.min(
    dp[i - 1]![j]! + 1,
    dp[i]![j - 1]! + 1,
    dp[i - 1]![j - 1]! + (expected[i - 1] === actual[j - 1] ? 0 : 1),
  );
  const missed: string[] = [], added: string[] = [];
  let correct = 0, substitutions = 0, i = n, j = m;
  while (i || j) {
    if (i && j && expected[i - 1] === actual[j - 1]) { correct++; i--; j--; }
    else if (i && j && dp[i]![j] === dp[i - 1]![j - 1]! + 1) {
      substitutions++; missed.push(expected[i - 1]!); added.push(actual[j - 1]!); i--; j--;
    } else if (i && dp[i]![j] === dp[i - 1]![j]! + 1) { missed.push(expected[i - 1]!); i--; }
    else if (j) { added.push(actual[j - 1]!); j--; }
    else break;
  }
  return { score: Math.max(0, Math.round(100 * (1 - dp[n]![m]! / n))),
    correct, targetCount: n, substitutions, missed: missed.reverse(), added: added.reverse() };
}

export function bestSpeechAlternative(target: string, transcripts: string[]): { transcript: string; match: SpeechMatch } {
  const choices = transcripts.filter(x => x.trim());
  const ranked = choices.map(transcript => ({ transcript, match: gradeSpeech(target, transcript) }))
    .sort((a,b) => b.match.score - a.match.score || b.match.correct - a.match.correct);
  return ranked[0] ?? { transcript: '', match: gradeSpeech(target, '') };
}
