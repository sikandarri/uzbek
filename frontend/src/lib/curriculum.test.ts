import { describe, expect, it } from 'vitest';
import {guideFor} from './curriculum';
const variants = ['general-english-a1','general-english-a2','general-english-b1','general-english-b2','general-english-c1',
 'ielts-preparation-academic','ielts-preparation-general-training',
 'multilevel-preparation-b1','multilevel-preparation-b2','multilevel-preparation-c1',
 'spoken-english-beginner','spoken-english-intermediate','spoken-english-advanced','conversation-scenarios'];
describe('study roadmap coverage', () => {
 it('gives four-skill guidance to all 14 courses in English and Uzbek', () => {
  for (const slug of variants) {
   const guide = guideFor(slug);
   expect(guide).not.toBeNull();
   expect(guide!.targetsEn).toHaveLength(4);
   expect(guide!.targetsUz).toHaveLength(4);
   expect(guide!.grammarEn.length).toBeGreaterThanOrEqual(3);
   expect(guide!.assessmentEn.length).toBeGreaterThanOrEqual(3);
   expect(guide!.references.length).toBeGreaterThan(0);
  }
 });
 it('does not claim practice scores are official IELTS or Multilevel results', () => {
  expect(guideFor('ielts-preparation-academic')!.disclaimerEn).toContain('not IELTS bands');
  expect(guideFor('multilevel-preparation-b2')!.disclaimerEn).toContain('not affiliated');
 });
});
