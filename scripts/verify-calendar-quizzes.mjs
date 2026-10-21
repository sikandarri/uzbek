/** Dependency-free calendar quiz regression test: Node 22+ supports TS stripping. */
import assert from 'node:assert/strict';
import { calendarGroups, createCalendarQuickCheck } from '../frontend/src/data/calendar.ts';

const testGroups=[...calendarGroups,
  {id:'empty',en:'Empty',uz:'Bo‘sh',words:[]},
  {id:'one',en:'One',uz:'Bir',words:[{en:'spring',uz:'bahor'}]},
  {id:'two',en:'Two',uz:'Ikki',words:[{en:'spring',uz:'bahor'},{en:'summer',uz:'yoz'}]},
  {id:'three',en:'Three',uz:'Uch',words:[{en:'spring',uz:'bahor'},{en:'summer',uz:'yoz'},{en:'winter',uz:'qish'}]},
  {id:'duplicate',en:'Duplicate',uz:'Takror',words:[{en:'a',uz:'bir'}, {en:'b',uz:'bir'}, {en:'c',uz:'bir'}]},
];
for(const group of testGroups){
  const result=createCalendarQuickCheck(group);
  if(group.words.length<2 || group.id==='duplicate'){
    assert.equal(result,null,`${group.id} must show no quiz rather than crash`);
    continue;
  }
  assert.ok(result,`Missing quiz for ${group.id}`);
  assert.ok(result.options.length>=2 && result.options.length<=3,`Invalid answer count for ${group.id}`);
  assert.equal(result.options[result.correctIndex]?.uz,result.target.uz,`Incorrect answer for ${group.id}`);
  assert.equal(new Set(result.options.map(x=>x.uz)).size,result.options.length,`Repeated meanings in ${group.id}`);
  assert.ok(result.options.every(x=>x?.en?.trim()&&x?.uz?.trim()),`Empty option in ${group.id}`);
  console.log(`PASS ${group.id}: ${group.words.length} words, ${result.options.length} valid choices`);
}
assert.equal(calendarGroups.find(group=>group.id==='seasons')?.words.length,4);
console.log(`SUCCESS: ${calendarGroups.length} real calendar groups and ${testGroups.length-calendarGroups.length} edge cases passed.`);
