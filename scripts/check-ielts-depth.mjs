// Offline, dependency-free IELTS course coverage test.
import { readFileSync } from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../backend/prisma/course-content.json',import.meta.url),'utf8'));
const units=data.lessons.filter(u=>u.courseSlug.startsWith('ielts-preparation-'));
if(units.length!==22)throw Error(`Expected 22 distinct IELTS lessons; found ${units.length}`);
const normalize=v=>v.normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ').replace(/[.!? ]+$/,'');
const allVocab=new Set(), allSamples=new Set();
let vocab=0,samples=0,quizzes=0;
for (const unit of units){
 const key=`${unit.courseSlug}/${unit.modulePosition}`;
 const [ex,lex,reading,mic,quiz]=unit.lesson.blocks.map(b=>b.content);
 if(lex.items.length<24||reading.examples.length!==12||quiz.questions.length!==8||!ex.studyGuide?.grammar?.en||!ex.studyGuide?.grammar?.uz||!ex.studyGuide?.task?.en||!ex.studyGuide?.task?.uz||!ex.studyGuide?.model?.en||!ex.studyGuide?.pitfall?.en)throw Error(`Incomplete IELTS expansion: ${key}`);
 if(unit.lesson.objectivesEn.length<5||unit.lesson.objectivesUz.length<5)throw Error(`Incomplete learning goals: ${key}`);
 for(const item of lex.items){
   if(!item.en?.trim()||!item.uz?.trim())throw Error(`Missing bilingual vocabulary: ${key}`);
   const word=normalize(item.en);
   if(allVocab.has(word))throw Error(`Repeated IELTS vocabulary: ${word}`);
   allVocab.add(word);vocab++;
 }
 for(const item of reading.examples){
   if(!item.en?.trim()||!item.uz?.trim())throw Error(`Missing bilingual sentence: ${key}`);
   const sentence=normalize(item.en);
   if(allSamples.has(sentence))throw Error(`Repeated IELTS sentence: ${sentence}`);
   allSamples.add(sentence);samples++;
 }
 for(const q of quiz.questions){
   if(q.options.length!==4||new Set(q.options).size!==4||!q.options[q.answer]||!q.whyUz?.trim())throw Error(`Invalid IELTS question: ${key}`);
   quizzes++;
 }
 console.log(`${key}: ${lex.items.length} vocabulary items, ${reading.examples.length} bilingual example sentences, ${quiz.questions.length} questions`);
}
console.log(`PASS: ${units.length} IELTS lessons, ${vocab} IELTS vocabulary entries, ${samples} new distinct bilingual sentences, ${quizzes} IELTS self-check questions. All 22 lessons include bilingual grammar explanations, original guided challenges, worked models and cautions.`);
console.log('This verifies data structure and uniqueness, not official exam equivalence or audio quality.');
