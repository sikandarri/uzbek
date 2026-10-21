import { expect, describe, it } from 'vitest';
import { everydayTopics, everydayWordTotal, everydayExampleTotal } from './everyday-topics';
import { calendarGroups, calendarTotal, createCalendarQuickCheck } from './calendar';
import { vocabularyGroups, usefulWordGroups, phraseGroups } from './essentials';
describe('expanded bilingual everyday reference',()=>{
  it('covers requested beginner categories and practical Uzbek scenarios',()=>{
    expect(everydayTopics.length).toBe(41);
    for(const id of ['fruits','vegetables','colors','farm-animals','wild-animals','birds','daily-routines','kitchen-tools','medicine','uzbek-life']){
      expect(everydayTopics.some(g=>g.id===id)).toBe(true);
    }
    expect(everydayWordTotal).toBe(693);
    expect(everydayExampleTotal).toBe(82);
    expect(calendarGroups.find(g=>g.id==='months')?.words).toHaveLength(12);
    expect(calendarGroups.find(g=>g.id==='days')?.words).toHaveLength(7);
    expect(calendarGroups.find(g=>g.id==='ordinals')?.words).toHaveLength(31);
    expect(calendarTotal).toBeGreaterThan(90);
  });
  it('renders a safe quick check for every calendar group, including four-season vocabulary',()=>{
    const seasons=calendarGroups.find(g=>g.id==='seasons');
    expect(seasons?.words).toHaveLength(4);
    for(const group of calendarGroups){
      const quiz=createCalendarQuickCheck(group);
      expect(quiz, group.id).not.toBeNull();
      expect(quiz!.options.length).toBeGreaterThanOrEqual(2);
      expect(quiz!.options.length).toBeLessThanOrEqual(3);
      expect(quiz!.options[quiz!.correctIndex]?.uz).toBe(quiz!.target.uz);
      expect(quiz!.options.every(option => Boolean(option.en && option.uz))).toBe(true);
      expect(new Set(quiz!.options.map(option => option.uz)).size).toBe(quiz!.options.length);
    }
    expect(createCalendarQuickCheck({id:'empty',en:'Empty',uz:'Bo‘sh',words:[]})).toBeNull();
    expect(createCalendarQuickCheck({id:'one',en:'One',uz:'Bir',words:[{en:'spring',uz:'bahor'}]})).toBeNull();
    const two=createCalendarQuickCheck({id:'two',en:'Two',uz:'Ikki',words:[{en:'spring',uz:'bahor'},{en:'summer',uz:'yoz'}]});
    expect(two?.options).toHaveLength(2);
    expect(two?.options[two.correctIndex]?.uz).toBe(two?.target.uz);
  });
  it('does not repeat headwords, exact phrasebook sentences or lose Uzbek meanings',()=>{
    const all=[...everydayTopics,...calendarGroups,...vocabularyGroups,...usefulWordGroups].flatMap(g=>g.words);
    expect(new Set(all.map(x=>x.en.toLocaleLowerCase())).size).toBe(all.length);
    expect(all.every(x=>x.en.trim() && x.uz.trim())).toBe(true);
    const phrases=phraseGroups.flatMap(g=>g.words);
    expect(phrases).toHaveLength(120);
    expect(new Set(phrases.map(x=>x.en.toLocaleLowerCase())).size).toBe(phrases.length);
  });
});
