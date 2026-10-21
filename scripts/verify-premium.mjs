import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root=path.resolve(import.meta.dirname,'../frontend/src');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):/\.tsx?$/.test(d.name)?[path.join(dir,d.name)]:[])}
let files=0,errors=0;
for(const file of walk(root)) {
  const source=fs.readFileSync(file,'utf8');
  const out=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
  files++;
  for(const diagnostic of out.diagnostics??[])if(diagnostic.category===ts.DiagnosticCategory.Error) {
    errors++;
    console.error(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`);
  }
}
function loadPure(file) {
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('module','exports',code)(module,module.exports);
  return module.exports;
}
const essentials=loadPure(path.join(root,'data/essentials.ts'));
const speech=loadPure(path.join(root,'lib/speech-score.ts'));
const assert=(ok,message)=>{if(!ok){errors++; console.error('FAIL:',message);}};
assert(essentials.alphabet.length===26,'Expected 26 letters');
assert(essentials.numbers.filter(n=>n.n<=100).length===101,'Expected 0–100');
assert(essentials.englishNumber(200)==='two hundred','200 spelled');
assert(essentials.uzbekNumber(200)==='ikki yuz','200 Uzbek');
const phrases=essentials.phraseGroups.flatMap(g=>g.words);
const words=essentials.vocabularyGroups.flatMap(g=>g.words);
const useful=essentials.usefulWordGroups.flatMap(g=>g.words);
assert(phrases.length===120,'Expected 120 distinct phrases');
assert(words.length===132,'Expected 132 core everyday words after moving calendar entries');
assert(useful.length===80,'Expected 80 useful words');
assert(!useful.some(x => words.some(y => y.en.toLowerCase()===x.en.toLowerCase())),'Useful words repeat everyday vocabulary');
for (const [arr,label] of [[phrases,'phrases'],[words,'vocabulary'],[useful,'useful']]){
  assert(new Set(arr.map(x=>x.en.toLowerCase())).size===arr.length,'Duplicate '+label);
  assert(arr.every(x=>x.uz&&x.en),'Missing translation '+label);
}
const cases = [
  ['It costs two hundred som.','it costs 200 song',100],
  ['I have twenty five books.','i have 25 books',100],
  ["I'm ready.",'I am ready',100],
  ['One hundred and ten','110',100],
];
for(const [reference,heard,expected] of cases) assert(speech.gradeSpeech(reference,heard).score===expected,`STT ${reference} / ${heard}`);
assert(speech.gradeSpeech('It costs two hundred som','it costs 200 thousand song').score<100,'Wrong quantity incorrectly accepted');
assert(speech.gradeSpeech('I love this song','I love this som').score<100,'Currency alias overapplied');
assert(speech.bestSpeechAlternative('Two hundred som',['200 thousand song','200 so am']).match.score===100,'Alternative selection');
console.log(`TypeScript/TSX transpile checks: ${files} files. Essentials: ${essentials.alphabet.length} letters, ${essentials.numbers.length} number cards, ${phrases.length} phrases, ${words.length} words, ${useful.length} useful words. Speech tests: ${cases.length+3}. Issues: ${errors}.`);
if (errors) process.exit(1);
