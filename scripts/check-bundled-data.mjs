import { readFileSync } from 'node:fs';
const input = JSON.parse(readFileSync(new URL('../backend/prisma/course-content.json', import.meta.url), 'utf8'));
const { edition, lessons } = input;
const EXPECTED_EDITION='2026-10-unique-lessons-reviewed-v1';
const countByTrack = new Map([
  ['general-english',71],['ielts-preparation',22],['multilevel-preparation',33],
  ['spoken-english',37],['conversation',7],
]);
if (edition !== EXPECTED_EDITION || lessons.length !== 170) {
  throw new Error(`Unexpected curriculum ${edition}/${lessons.length}. Must be ${EXPECTED_EDITION}/170.`);
}
const normalize = s => String(s ?? '').normalize('NFKC').toLocaleLowerCase('en')
    .replace(/[\u2018\u2019]/g,"'").replace(/\s+/g,' ').trim().replace(/[.!? ]+$/,'');
const categories=['vocabulary headword','reading passage','speaking target','model sentence',
  'quiz question','writing assignment','lesson title','IELTS model sentence','CEFR model sentence'];
const used=Object.fromEntries(categories.map(c=>[c,new Map()]));
function unique(category, text, id) {
  const key=normalize(text);
  if (!key) throw new Error(`Blank ${category}: ${id}`);
  const old=used[category].get(key);
  if (old && old!==id) throw new Error(`Duplicate ${category} in ${old} and ${id}: ${String(text).slice(0,100)}`);
  used[category].set(key,id);
}
let quizzes=0, vocabulary=0, speech=0, ieltsSentences=0, ieltsUnits=0;const modules=new Set();const courseCounts=new Map();
for (const unit of lessons) {
  const id=`${unit.courseSlug}/${unit.modulePosition}/${unit.lesson.position}`;
  if (modules.has(`${unit.courseSlug}/${unit.modulePosition}`)) throw new Error(`Repeated module ${id}`);
  modules.add(`${unit.courseSlug}/${unit.modulePosition}`);
  if (unit.lesson.position !== 0 || !['lesson-1','clinic-1'].includes(unit.lesson.slug))
    throw new Error(`Cloned/legacy follow-up lesson detected: ${id}`);
  if (unit.lesson.blocks.map(b=>b.type).join(',')!=='EXPLANATION,VOCABULARY,READING,MICROPHONE,QUESTION')
    throw new Error(`Invalid teaching blocks: ${id}`);
  if (!unit.lesson.objectivesEn?.length || !unit.lesson.objectivesUz?.length)
    throw new Error(`Missing bilingual goals: ${id}`);
  const [e,v,r,m,q] = unit.lesson.blocks.map(b=>b.content);
  if (!r.en || !r.uz || !e.modelEn || !e.modelUz || !m.sampleEn || !m.sampleUz)
    throw new Error(`Missing bilingual explanation, passage or model: ${id}`);
  if (!Array.isArray(v.items) || !v.items.length) throw new Error(`No real vocabulary: ${id}`);
  if (!Array.isArray(m.drills) || !m.drills.length) throw new Error(`No spoken practice: ${id}`);
  const ielts=unit.courseSlug.startsWith('ielts-preparation-');
  const cefr=unit.courseSlug.startsWith('multilevel-preparation-');
  if (!Array.isArray(q.questions) || q.questions.length!==((ielts||cefr)?8:4)) throw new Error(`Incomplete quiz: ${id}`);
  if (ielts) {
    if(v.items.length<24 || (r.examples??[]).length!==12 || !e.studyGuide?.grammar?.en || !e.studyGuide?.task?.uz || !e.studyGuide?.pitfall?.en) throw new Error(`Thin IELTS content: ${id}`);
  }
  if (cefr) {
    if (v.items.length<22 || r.examples?.length!==12 || m.drills.length<9 || !e.studyGuide?.grammar?.en || !e.studyGuide?.task?.uz || !e.studyGuide?.model?.uz) throw new Error(`Thin CEFR content: ${id}`);
    for (const p of r.examples) { if(!p.en?.trim() || !p.uz?.trim()) throw new Error(`Empty CEFR bilingual sentence: ${id}`); unique('CEFR model sentence',p.en,id); }
  }
  unique('reading passage',r.en,id);
  if (unit.courseSlug.startsWith('ielts-preparation-')) {
    ieltsUnits++;
    for (const p of r.examples) { if(!p.en?.trim() || !p.uz?.trim()) throw new Error(`Empty IELTS bilingual example: ${id}`); unique('IELTS model sentence',p.en,id); ieltsSentences++; }
  }
  unique('model sentence',e.modelEn,id);
  unique('lesson title',unit.lesson.titleEn,id);
  unique('writing assignment',q.writingPromptEn,id);
  for (const w of v.items) {
    if (!w.en?.trim() || !w.uz?.trim()) throw new Error(`Untranslated vocabulary: ${id}`);
    unique('vocabulary headword',w.en,id);vocabulary++;
  }
  for (const d of m.drills) {
    if (!d.en?.trim()||!d.uz?.trim()) throw new Error(`Untranslated speaking target: ${id}`);
    unique('speaking target',d.en,id);speech++;
  }
  for (const question of q.questions) {
    unique('quiz question',question.promptEn,id);
    if (question.options?.length!==4 || !Number.isInteger(question.answer)
      || question.answer<0 || question.answer>3 || !question.whyEn?.trim() || !question.whyUz?.trim())
      throw new Error(`Invalid MCQ: ${id}`);
    quizzes++;
  }
  courseCounts.set(unit.courseSlug,(courseCounts.get(unit.courseSlug)??0)+1);
}
// A copied template with one changed level could pass exact-string checks.
// Detect those near-clones using sets of meaningful English tokens.
const tokenSet=s => new Set((String(s).toLowerCase().match(/[a-z]{3,}/g)??[]));
const passages=lessons.map(u=>({
  id:`${u.courseSlug}/${u.modulePosition}`,
  tokens:tokenSet(u.lesson.blocks.find(b=>b.type==='READING').content.en),
}));
for(let i=0;i<passages.length;i++) for(let j=i+1;j<passages.length;j++){
  const a=passages[i], b=passages[j];
  let intersection=0;
  for(const token of a.tokens) if(b.tokens.has(token)) intersection++;
  const similarity=intersection/(a.tokens.size+b.tokens.size-intersection);
  if(similarity>0.62)
    throw new Error(`Near-duplicate reading passages (${similarity.toFixed(2)}): ${a.id} and ${b.id}`);
}
if (courseCounts.size!==14 || modules.size!==170)
  throw new Error(`Expected 14 variants and 170 modules, found ${courseCounts.size}/${modules.size}`);
for (const [track,required] of countByTrack) {
  const actual=lessons.filter(u=>u.courseSlug.startsWith(track+'-')).length;
  if (actual!==required) throw new Error(`${track}: ${actual}, expected ${required}`);
  console.log(`${track}: ${actual} individually different lessons`);
}
console.log(`PASS IELTS DEPTH: ${ieltsUnits} lessons, ${ieltsSentences} distinct bilingual example sentences.`);
console.log(`PASS: ${lessons.length} distinct lessons; ${vocabulary} distinct vocabulary entries; ${speech} distinct speaking targets; ${quizzes} self-check questions.`);
console.log(`No repeated lesson titles, full readings, vocabulary headwords, microphone sentences, quiz prompts, or writing assignments across lessons. No reading pairs with Jaccard similarity > 0.62.`);
console.log('Common grammar and function words may naturally recur inside English sentences.');
