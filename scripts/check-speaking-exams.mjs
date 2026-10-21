import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync(new URL('../backend/prisma/course-content.json',import.meta.url),'utf8'));
if(source.lessons.length!==170||source.speakingExamEdition!=='2026-10-speaking-exam-v1')throw Error('Unexpected lesson count or assessment edition');
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s.!?]+/g,' ').trim();
const allMissions=new Set(),allStems=new Set(),allEchoes=new Set();
let mcqs=0,missions=0,repeatTargets=0,writing=0,liveItems=0;let byTrack=new Map();
for(const unit of source.lessons){
 const id=`${unit.courseSlug}/${unit.modulePosition}`;
 const mic=unit.lesson.blocks.find(b=>b.type==='MICROPHONE')?.content;
 const exam=unit.lesson.blocks.find(b=>b.type==='QUESTION')?.content?.lessonExam;
 if(!exam||!mic?.speakingExpansion)throw Error(`Missing speaking/exam: ${id}`);
 const bank=mic.speakingExpansion;
 if(bank.repeat.length<3||bank.missions.length!==12)throw Error(`Too few speaking exercises: ${id}`);
 if(!bank.repeat.every(p=>p.en&&typeof p.en==='string'&&typeof p.uz==='string'))throw Error(`Invalid repeat lines: ${id}`);
 if(new Set(bank.repeat.map(p=>norm(p.en))).size!==bank.repeat.length)throw Error(`Repeated speaking line: ${id}`);
 for(const line of bank.repeat){const k=norm(line.en);if(allEchoes.has(k))throw Error(`Repeated repeat target across courses: ${id}: ${k}`);allEchoes.add(k);}
 repeatTargets+=bank.repeat.length;
 for(const mission of bank.missions){
  if(!mission.en||!mission.uz||!mission.kind||mission.minimumSeconds<15)throw Error(`Incomplete bilingual speaking task: ${id}`);
  const k=norm(mission.en);if(allMissions.has(k))throw Error(`Duplicated speaking task: ${id}: ${k}`);allMissions.add(k);missions++;
 }
 if(exam.version!=='lesson-exam-v1'||exam.recommendedMinutes<20||exam.passingPercent<60||exam.passingPercent>90)throw Error(`Invalid exam metadata: ${id}`);
 if(exam.sections.length!==4||exam.speakingTasks.length!==2)throw Error(`Exam sections missing: ${id}`);
 const sectionNames=exam.sections.map(s=>s.kind).join(',');
 if(sectionNames!=='vocabulary,reading,listening,language')throw Error(`Wrong exam sections: ${id}`);
 let total=0;
 for(const section of exam.sections){
  if(section.questions.length<2||!section.titleEn||!section.titleUz)throw Error(`Empty section ${id}/${section.kind}`);
  for(const q of section.questions){
   if(!q.promptEn||!q.promptUz||!q.whyEn||!q.whyUz||q.options.length!==4||new Set(q.options.map(norm)).size!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)throw Error(`Broken item ${id}/${section.kind}`);
   if(section.kind==='listening'&&!q.audioEn)throw Error(`Missing listening audio ${id}`);
   const k=norm(q.promptEn);
   if(allStems.has(k))throw Error(`Repeated exam prompt across lessons: ${k}`);
   allStems.add(k);total++;mcqs++;
  }
 }
 if(total!==22)throw Error(`Only ${total} questions in ${id}`);
 if(!exam.writingTask.en||!exam.writingTask.uz||!exam.writingTask.criteriaEn?.length||!exam.writingTask.modelEn?.length)throw Error(`Missing exam writing task: ${id}`);
 if(exam.speakingTasks.some(t=>!t.en||!t.uz||t.criteriaEn.length!==4||t.criteriaUz.length!==4))throw Error(`Invalid oral exam: ${id}`);
 liveItems+=exam.speakingTasks.length;writing++;
 const track=unit.courseSlug.split('-')[0];byTrack.set(track,(byTrack.get(track)||0)+1);
}
console.log(`PASS: ${source.lessons.length} lessons, ${missions} distinct guided speaking missions, ${repeatTargets} source-based repeat targets.`);
console.log(`PASS: ${mcqs} uniquely worded 4-option items, ${liveItems} self-reviewed speaking exam assignments, ${writing} writing assignments.`);
console.log(`PASS: English/Uzbek instructions and explanations; no exact repeated exam stems or missions.`);
console.log('Sections: vocabulary, reading evidence, synthetic listening, English in use. Scores are objective practice scores only, not official tests.');
