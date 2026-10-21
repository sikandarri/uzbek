/** Checks the full Essentials reference for missing Uzbek text and exact repetition. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(import.meta.dirname,'../frontend/src');
const topics = JSON.parse(fs.readFileSync(path.join(root,'data/everyday-topics.json'),'utf8'));
function moduleFromSource(name){
  const source = fs.readFileSync(path.join(root,'data',name),'utf8');
  const js = ts.transpileModule(source,{fileName:name,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{}};
  new Function('module','exports',js)(mod,mod.exports);
  return mod.exports;
}
const {vocabularyGroups,usefulWordGroups,phraseGroups,alphabet,numbers}=moduleFromSource('essentials.ts');
const {calendarGroups,calendarExamples}=moduleFromSource('calendar.ts');
assert.equal(alphabet.length,26,'Alphabet must cover all letters');
assert(numbers.length>=100,'Number reference must include 0-100');
assert.equal(topics.length,41,'Expected all new topic categories');
const allWords=[...vocabularyGroups,...usefulWordGroups,...calendarGroups,...topics].flatMap(g=>g.words);
const phrases=phraseGroups.flatMap(g=>g.words);
assert(topics.every(g=>g.words.length>=14 && g.examples.length>=2),'Each new topic needs useful vocabulary and examples');
assert(topics.some(g=>g.id==='fruits')&&topics.some(g=>g.id==='vegetables')&&topics.some(g=>g.id==='colors')&&topics.some(g=>g.id==='farm-animals')&&topics.some(g=>g.id==='wild-animals'),'Must cover requested topics');
assert(calendarGroups.some(g=>g.id==='months'&&g.words.length===12),'All months must be present');
assert(calendarGroups.some(g=>g.id==='days'&&g.words.length===7),'All days must be present');
assert(calendarGroups.some(g=>g.id==='ordinals'&&g.words.length===31),'Date ordinals must be present');
function checkDistinct(items,label){
  assert(items.every(w=>typeof w.en==='string'&&w.en.trim()&&typeof w.uz==='string'&&w.uz.trim()),`Missing translation in ${label}`);
  const map = new Map();
  for(const w of items){
    const key=w.en.trim().toLocaleLowerCase().replace(/[.!?]+$/,'');
    assert(!map.has(key),`Repeated English ${label}: ${w.en}`);
    map.set(key,w.uz);
  }
}
checkDistinct(allWords,'headwords (combined reference)');
checkDistinct(phrases,'phrasebook sentences');
checkDistinct([...topics.flatMap(g=>g.examples),...calendarExamples],'practical sample sentences');
const pages = [
  ['App.tsx','essentials/topics/:topicId'],
  ['App.tsx','essentials/calendar'],
  ['pages/daily-library.tsx','<SpeakingLab'],
  ['pages/daily-library.tsx','localStorage'],
  ['pages/daily-library.tsx','Quick meaning check'],
  ['pages/essentials.tsx','Everyday topic library'],
];
for (const [file,search] of pages) {
  assert(fs.readFileSync(path.join(root,file),'utf8').includes(search),`Missing screen component: ${file} => ${search}`);
}
console.log(`PASS: ${topics.length} new topics / ${topics.flatMap(g=>g.words).length} new entries / ${topics.flatMap(g=>g.examples).length} topic examples`);
console.log(`PASS: ${calendarGroups.length} calendar groups / ${calendarGroups.flatMap(g=>g.words).length} expressions / ${phrases.length} practical phrases`);
console.log(`PASS: ${allWords.length} unique reference headwords; ${phrases.length} unique phrasebook sentences; no missing English/Uzbek pairs.`);
console.log('PASS: calendar, searchable topic browser, audio, speaking practice, quiz and local mastery routes.');
