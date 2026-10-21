import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../backend/prisma/course-content.json', import.meta.url), 'utf8'));
const units = data.lessons.filter(x => x.courseSlug.startsWith('multilevel-preparation-'));
const lower = s => String(s ?? '').normalize('NFKC').trim().toLowerCase().replace(/[\s\u2018\u2019]+/g, ' ');
const vocabulary = new Set(), examples = new Set();
const tally = { b1: { lessons: 0, vocabulary: 0, sentences: 0 }, b2: { lessons: 0, vocabulary: 0, sentences: 0 }, c1: { lessons: 0, vocabulary: 0, sentences: 0 } };
if (units.length !== 33) throw Error(`Expected 33 CEFR lessons, found ${units.length}`);
for (const unit of units) {
  const lvl = unit.courseSlug.slice(-2);
  const key = `${unit.courseSlug}/${unit.modulePosition}`;
  const [ex, vocab, reading, mic, quiz] = unit.lesson.blocks.map(x => x.content);
  const exam = quiz.lessonExam;
  if (!tally[lvl] || vocab.items.length < 22 || reading.examples?.length !== 12 || mic.drills.length < 9 || quiz.questions.length !== 8 || !ex.studyGuide?.grammar?.uz || !ex.studyGuide?.task?.en || !ex.studyGuide?.model?.uz || !ex.studyGuide?.pitfall?.en || exam?.sections?.reduce((n,x)=>n+x.questions.length,0)!==22) throw Error(`Incomplete CEFR material: ${key}`);
  for (const p of vocab.items) {
    if (!p.en?.trim() || !p.uz?.trim() || vocabulary.has(lower(p.en))) throw Error(`Duplicate/empty CEFR vocabulary: ${key}: ${p.en}`);
    vocabulary.add(lower(p.en)); tally[lvl].vocabulary++;
  }
  for (const p of reading.examples) {
    if(!p.en?.trim() || !p.uz?.trim() || examples.has(lower(p.en))) throw Error(`Duplicate/empty CEFR sentence: ${key}: ${p.en}`);
    examples.add(lower(p.en)); tally[lvl].sentences++;
  }
  if (new Set(quiz.questions.map(q=>lower(q.promptEn))).size!==8)throw Error(`Repeated quiz prompt: ${key}`);
  for (const q of quiz.questions) {
    if(q.options.length!==4||new Set(q.options.map(lower)).size!==4||q.answer<0||q.answer>3 || !q.options[q.answer])throw Error(`Malformed CEFR quiz: ${key}`);
  }
  for (const p of reading.examples.slice(0,8)) {
    if(!mic.drills.some(x=>lower(x.en)===lower(p.en)))throw Error(`Speaking repeat practice missing: ${key}`);
  }
  tally[lvl].lessons++;
}
for (const [lvl,row] of Object.entries(tally)){
 if(row.lessons!==11)throw Error(`Wrong ${lvl.toUpperCase()} module count`);
 console.log(`CEFR ${lvl.toUpperCase()}: ${row.lessons} distinct lessons, ${row.vocabulary} unique topic expressions, ${row.sentences} translated model sentences.`);
}
console.log(`PASS: 33 CEFR lessons; ${vocabulary.size} CEFR vocabulary entries; ${examples.size} new unique bilingual example sentences; 264 lesson checkpoint questions and 726 existing exam questions.`);
console.log('Note: independent learning content, not a certified Uzbekistan national exam or level equivalence.');
