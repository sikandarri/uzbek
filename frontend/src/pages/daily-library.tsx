import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2, ChevronRight, LibraryBig, Search, Sparkles, Volume2 } from 'lucide-react';
import { everydayCategories, everydayExampleTotal, everydayTopics, everydayWordTotal, type DailyEntry } from '../data/everyday-topics';
import { calendarGroups, calendarExamples, calendarTotal, createCalendarQuickCheck } from '../data/calendar';
import SpeakingLab from '../components/speaking-lab';

const rememberedKey = 'noldan-ravon.essentials.mastered.v1';
const categoryUz: Record<string,string> = {
  Food:'Oziq-ovqat', Animals:'Hayvonlar', Descriptions:'Ta’riflar', Health:'Salomatlik',
  'Daily life':'Kundalik hayot', Home:'Uy', Study:'O‘qish', Lifestyle:'Turmush tarzi',
  Practical:'Amaliy vaziyatlar', Travel:'Sayohat', Nature:'Tabiat', Uzbekistan:'O‘zbekiston'
};
function sound(en: string, setError: (error: string)=>void, rate=0.85) {
  if (!('speechSynthesis' in window)) { setError('Speech audio is not available in this browser.'); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(en);
  utterance.lang = 'en-GB'; utterance.rate=rate;
  window.speechSynthesis.speak(utterance);
  setError('');
}
function useMastered() {
  const [mastered,setMastered] = useState<string[]>(()=>{
    try { const data=JSON.parse(window.localStorage.getItem(rememberedKey) || '[]'); return Array.isArray(data) ? data.filter((x):x is string=>typeof x==='string') : []; }
    catch { return []; }
  });
  function toggle(key:string){
    setMastered(current=>{
      const next=current.includes(key)?current.filter(x=>x!==key):[...current,key];
      try { window.localStorage.setItem(rememberedKey,JSON.stringify(next)); } catch { /* Private mode can block storage */ }
      return next;
    });
  }
  return {mastered,toggle};
}
function SpeechButton({text,slow=false}: {text:string;slow?:boolean}) {
  const [error,setError]=useState('');
  return <span className="inline-flex flex-col items-end gap-1"><button type="button" className="sound-button shrink-0" title={`Listen to ${text}`} aria-label={`Hear ${text}`} onClick={()=>sound(text,setError,slow?0.7:0.85)}><Volume2 size={17}/></button>{error && <span role="status" className="max-w-28 text-right text-[10px] text-red-700">{error}</span>}</span>;
}
function WordTile({word,remembered,onToggle,showUz=true,isUz=false}: {word:DailyEntry;remembered?:boolean;onToggle?:()=>void;showUz?:boolean;isUz?:boolean}) {
 return <article className="essentials-tile flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-[#dde6dd] bg-white p-4 sm:p-5"><div className="min-w-0"><strong className="block break-words text-[15px] font-bold text-[#173f37]">{word.en}</strong><span className="mt-1 block break-words text-sm text-slate-500">{showUz ? word.uz : '••••••'}</span>{onToggle&&<button className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${remembered?'bg-[#e4efe6] text-[#1a634e]':'bg-[#f5f5f1] text-slate-600'}`} type="button" aria-pressed={Boolean(remembered)} onClick={onToggle}><Check size={13}/>{isUz?(remembered?'O‘rganildi':'O‘rganildi deb belgilash'):(remembered?'Learned':'Mark learned')}</button>}</div><SpeechButton text={word.en}/></article>;
}
function PageHeader({back,title,eyebrow,description,uz}: {back:string;title:string;eyebrow:string;description:string;uz:boolean}) {
 return <><Link to={back} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#28644f]"><ArrowLeft size={15}/>{uz?'Orqaga qaytish':'Back to essentials'}</Link><div className="mb-8 max-w-3xl"><p className="premium-kicker">{eyebrow}</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-.045em] text-[#173c35] sm:text-5xl">{title}</h1><p className="mt-3 text-base leading-8 text-slate-600">{description}</p></div></>;
}
export function EverydayTopicsPage(){
 const {topicId}=useParams(); const {i18n}=useTranslation(); const uz=i18n.language!=='en';
 const [query,setQuery]=useState(''); const [category,setCategory]=useState('all');
 const [showTranslations,setShowTranslations]=useState(true);
 const [index,setIndex]=useState(0); const [choice,setChoice]=useState<number|null>(null);
 const {mastered,toggle}=useMastered();
 const topic=everydayTopics.find(t=>t.id===topicId);
 useEffect(()=>{setQuery('');setShowTranslations(true);setIndex(0);setChoice(null)},[topicId]);
 const entries=useMemo(()=>topic?.words.filter(w=>(w.en+' '+w.uz).toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()))??[],[topic,query]);
 const topicOptions=useMemo(()=>{if(!topic)return [];const correctIndex=index%4;return Array.from({length:4},(_,j)=>j===correctIndex?topic.words[index%topic.words.length]:topic.words[(index+j+2)%topic.words.length]);},[topic,index]);
 const filtered=everydayTopics.filter(t=>(category==='all'||t.category===category)&&[t.en,t.uz,...t.words.flatMap(w=>[w.en,w.uz])].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
 const progress=topic?topic.words.filter(w=>mastered.includes(`${topic.id}:${w.en}`)).length:mastered.length;
 return <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 lg:px-8">
 {!topicId ? <>
 <PageHeader uz={uz} back="/essentials" eyebrow={uz?'KUNDALIK SO‘ZLAR':'EVERYDAY ENGLISH'} title={uz?'Kundalik mavzular kutubxonasi':'Everyday topics, made practical.'} description={uz?'Meva va sabzavotlardan tortib ish, sayohat va salomatlikkacha bo‘lgan mavzular. So‘zlarni tinglang, o‘zbekchasini o‘qing va mashq qiling.':'Browse real-life vocabulary by topic, hear every word, learn with Uzbek translations and practise useful sentences.'}/>
 <div className="mb-8 grid gap-3 rounded-[1.75rem] bg-[#123e34] p-6 text-white sm:grid-cols-3 sm:p-8"><div><div className="text-3xl font-extrabold">{everydayTopics.length}</div><div className="mt-1 text-sm text-white/70">{uz?'Mavzular':'Topic collections'}</div></div><div><div className="text-3xl font-extrabold">{everydayWordTotal}</div><div className="mt-1 text-sm text-white/70">{uz?'So‘z va birikmalar':'Words & expressions'}</div></div><div><div className="text-3xl font-extrabold">{everydayExampleTotal}</div><div className="mt-1 text-sm text-white/70">{uz?'Misol gaplar':'Practical examples'}</div></div></div>
 <div className="mb-7 flex flex-col gap-3 sm:flex-row"><label className="relative min-w-0 flex-1"><Search size={18} className="absolute left-4 top-3.5 text-slate-400"/><span className="sr-only">{uz?'Qidirish':'Search vocabulary'}</span><input className="w-full !pl-11" value={query} placeholder={uz?'Inglizcha yoki o‘zbekcha so‘zni qidiring':'Find a topic or search any English / Uzbek word'} onChange={e=>setQuery(e.target.value)}/></label><select aria-label={uz?'Toifa':'Category'} className="min-w-48" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">{uz?'Barcha toifalar':'All categories'}</option>{everydayCategories.map(c=><option key={c} value={c}>{uz?categoryUz[c]??c:c}</option>)}</select></div>
 <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{uz?`${filtered.length} ta mavzu topildi`:`${filtered.length} topics to explore`}</p><span className="rounded-full bg-[#e4eee5] px-4 py-2 text-xs font-bold text-[#205543]">{uz?'O‘rganilgan kartalar':'Cards learned'}: {progress}</span></div>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((t,i)=>{const completed=t.words.filter(w=>mastered.includes(`${t.id}:${w.en}`)).length;return <Link to={`/essentials/topics/${t.id}`} key={t.id} className="essentials-tile group flex min-w-0 flex-col justify-between rounded-[1.5rem] border border-[#e0e7db] bg-white p-6"><div className="mb-8 flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f1e8] text-[#21614c]"><LibraryBig size={22}/></span><span className="rounded-full bg-[#f7f2e8] px-3 py-1 text-[11px] font-bold text-[#9b7845]">{uz?categoryUz[t.category]??t.category:t.category}</span></div><h2 className="text-xl font-extrabold text-[#153e33]">{uz?t.uz:t.en}</h2><p className="mt-1 text-sm text-slate-500">{uz?t.en:t.uz}</p><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#e8ede7]"><div className="h-full rounded-full bg-[#31846b]" style={{width:`${completed/t.words.length*100}%`}}/></div><div className="mt-3 flex justify-between gap-2 text-xs font-bold text-[#2a6652]"><span>{completed}/{t.words.length} {uz?'o‘rganilgan':'learned'}</span><ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/></div></Link>})}</div>
 {!filtered.length&&<div className="rounded-xl bg-white p-8 text-center text-slate-500">{uz?'Mos mavzu topilmadi.':'No topics match that search.'}</div>}
 </> : !topic ? <div role="alert" className="rounded-xl bg-white p-8"><h1 className="text-2xl font-bold">{uz?'Mavzu topilmadi':'Topic not found'}</h1><Link className="mt-4 inline-flex text-teal-700" to="/essentials/topics">{uz?'Mavzularga qaytish':'Browse topics'}</Link></div> : <>
 <PageHeader uz={uz} back="/essentials/topics" eyebrow={(uz?categoryUz[topic.category]??topic.category:topic.category).toUpperCase()} title={uz?topic.uz:topic.en} description={uz?`Ushbu mavzuda ${topic.words.length} ta so‘z va ${topic.examples.length} ta amaliy gap bor. Har bir so‘zni eshiting va bilganlaringizni belgilang.`:`Learn ${topic.words.length} topic-specific English words with Uzbek translations, examples and interactive practice.`}/>
 <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dce8dd] bg-[#eaf3ec] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#184b3d]"><CheckCircle2 size={18}/>{progress}/{topic.words.length} {uz?'o‘rganilgan':'learned'}</div><button className="rounded-lg border border-[#bed0be] bg-white px-4 py-2 text-xs font-bold text-[#265846]" type="button" onClick={()=>setShowTranslations(!showTranslations)}>{showTranslations?(uz?'Tarjimani yashirish':'Hide Uzbek meanings'):(uz?'Tarjimani ko‘rsatish':'Reveal Uzbek meanings')}</button></div>
 <div className="mb-7 flex items-center gap-3"><label className="relative min-w-0 flex-1"><Search size={18} className="absolute left-4 top-3.5 text-slate-400"/><span className="sr-only">{uz?'So‘z qidirish':'Filter vocabulary'}</span><input value={query} onChange={e=>setQuery(e.target.value)} className="w-full !pl-11" placeholder={uz?'So‘zlarni qidiring':'Find a word in this topic'}/></label></div>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{entries.map(w=><WordTile key={w.en} word={w} remembered={mastered.includes(`${topic.id}:${w.en}`)} showUz={showTranslations} isUz={uz} onToggle={()=>toggle(`${topic.id}:${w.en}`)}/>)}</div>
 {entries.length===0 && <p className="rounded-xl bg-white p-8 text-center text-slate-500">{uz?'Hech narsa topilmadi':'No matching word found'}</p>}
 <section className="mt-12 rounded-[1.6rem] border border-[#e1e9df] bg-white p-5 sm:p-8"><div className="flex items-center gap-2"><BookOpen size={21} className="text-[#2b775e]"/><h2 className="text-2xl font-bold">{uz?'Hayotiy misollar':'Real-life example sentences'}</h2></div><p className="mt-2 text-sm text-slate-500">{uz?'Tinglang, ma’nosini tushuning va o‘zingiz takrorlang.':'Listen, understand the context and repeat.'}</p><div className="mt-5 space-y-3">{topic.examples.map((ex,i)=><div key={i} className="flex items-start justify-between gap-3 rounded-xl bg-[#f4f6f1] p-4"><div><p className="font-semibold leading-7 text-[#153e35]">{ex.en}</p><p className="mt-1 text-sm text-slate-600">{ex.uz}</p></div><SpeechButton text={ex.en} slow/></div>)}</div></section>
 <section className="mt-8 rounded-[1.6rem] border border-[#e1e9df] bg-white p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Sparkles size={20} className="text-[#2b775e]"/><h2 className="text-xl font-bold">{uz?'Tezkor test':'Quick meaning check'}</h2></div><p className="mt-1 text-sm text-slate-500">{uz?'To‘g‘ri o‘zbekcha ma’noni tanlang.':'Choose the correct Uzbek meaning.'}</p></div><span className="rounded-full bg-[#f1f5ed] px-3 py-2 text-xs font-semibold text-[#245b4b]">{(index % topic.words.length)+1}/{topic.words.length}</span></div><p className="mt-6 text-xl font-bold">{topic.words[index % topic.words.length]!.en}</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{topicOptions.map((answer,i)=><button key={`${i}-${answer.en}`} type="button" onClick={()=>setChoice(i)} disabled={choice!==null} className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-semibold ${choice!==null && i===index%4?'border-green-600 bg-green-50 text-green-900':choice===i?'border-red-500 bg-red-50 text-red-900':'border-[#dce5dc] bg-[#f8faf7] text-[#244b41]'}`}>{answer.uz}</button>)}</div>{choice!==null&&<div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p role="status" className={`text-sm font-semibold ${choice===index%4?'text-green-800':'text-red-800'}`}>{choice===index%4?(uz?'To‘g‘ri!':'Correct!'):(uz?`To‘g‘ri javob: ${topic.words[index%topic.words.length]!.uz}`:`Correct answer: ${topic.words[index%topic.words.length]!.uz}`)}</p><button type="button" className="btn" onClick={()=>{setIndex((index+1)%topic.words.length);setChoice(null)}}>{uz?'Keyingisi':'Next question'}<ArrowRight size={15}/></button></div>}</section>
 <div className="mt-8"><SpeakingLab lessonId={`daily-topic-${topic.id}`} prompts={topic.examples}/></div>
 <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-[#dce5dc] pt-6"><Link className="inline-flex items-center gap-2 text-sm font-bold text-teal-800" to="/essentials/topics"><ArrowLeft size={16}/>{uz?'Barcha mavzular':'All topics'}</Link><Link to={`/essentials/topics/${everydayTopics[(everydayTopics.findIndex(t=>t.id===topic.id)+1)%everydayTopics.length]!.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-teal-800">{uz?'Keyingi mavzu':'Next topic'}<ArrowRight size={16}/></Link></div>
 </>}
 </div>;
}

export function CalendarPage(){
 const {i18n}=useTranslation(); const uz=i18n.language!=='en';
 const [active,setActive]=useState('days'); const [query,setQuery]=useState(''); const [choice,setChoice]=useState<number|null>(null);
 const current=calendarGroups.find(g=>g.id===active) ?? calendarGroups[0] ?? {id:'empty',en:'Calendar',uz:'Taqvim',words:[]};
 const quiz=createCalendarQuickCheck(current);
 const words=current.words.filter(w=>(w.en+' '+w.uz).toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
 return <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 lg:px-8"><PageHeader uz={uz} back="/essentials" eyebrow={uz?'TAQVIM VA VAQT':'CALENDAR & TIME'} title={uz?'Hafta, oy, fasl va vaqt':'Days, months, dates and time.'} description={uz?'Hafta kunlari, 12 oy, yil fasllari, vaqt va uchrashuvlarni inglizcha aytishni o‘rganing.':'Learn to say the days, all 12 months, seasons, dates and clock times, with Uzbek explanations and audio.'}/>
 <div className="mb-7 grid grid-cols-2 gap-3 rounded-2xl bg-[#123e34] p-5 text-white sm:grid-cols-3"><div className="text-sm"><strong className="block text-2xl">7</strong>{uz?'Hafta kunlari':'Days'}</div><div className="text-sm"><strong className="block text-2xl">12</strong>{uz?'Oylar':'Months'}</div><div className="text-sm"><strong className="block text-2xl">{calendarTotal}</strong>{uz?'Taqvim iboralari':'Calendar expressions'}</div></div>
 <div className="mb-6 flex flex-wrap gap-2">{calendarGroups.map(g=><button key={g.id} type="button" aria-pressed={active===g.id} className={`rounded-full border px-4 py-2 text-xs font-bold ${active===g.id?'border-[#16463b] bg-[#16463b] text-white':'border-[#dce6dc] bg-white text-[#2c6654]'}`} onClick={()=>{setActive(g.id);setQuery('');setChoice(null)}}>{uz?g.uz:g.en}</button>)}</div>
 <label className="relative mb-6 block max-w-xl"><Search size={17} className="absolute left-4 top-3.5 text-slate-400"/><span className="sr-only">{uz?'Qidirish':'Search calendar vocabulary'}</span><input className="w-full !pl-11" value={query} onChange={e=>setQuery(e.target.value)} placeholder={uz?'Inglizcha yoki o‘zbekcha qidirish':'Search English / Uzbek calendar expressions'}/></label>
 <h2 className="mb-5 text-2xl font-bold">{uz?current.uz:current.en}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{words.map(w=><WordTile key={w.en} word={w}/>)}</div>{words.length===0&&<p className="rounded-xl bg-white p-6 text-center text-slate-500">{uz?'Mos so‘z topilmadi':'No results found'}</p>}
 <section className="mt-10 grid gap-3 sm:grid-cols-3" aria-label={uz?'Vaqt predloglari':'Time prepositions'}>
 {[
  {mark:'ON',title:'on Monday',uz:'dushanba kuni',en:'Use on with days and specific dates.'},
  {mark:'IN',title:'in August',uz:'avgust oyida',en:'Use in with months, years and seasons.'},
  {mark:'AT',title:'at 7:30',uz:'soat 7:30 da',en:'Use at with precise times.'},
 ].map(rule=><div key={rule.mark} className="rounded-2xl border border-[#dfebe0] bg-[#f0f6f0] p-5"><span className="text-xs font-bold tracking-widest text-[#25735b]">{rule.mark}</span><h3 className="mt-2 font-bold text-[#153e35]">{rule.title}</h3><p className="mt-1 text-sm text-slate-600">{rule.uz}</p><p className="mt-3 text-xs leading-6 text-slate-500">{uz?'Inglizcha vaqt va sanani aytishda shu predlogdan foydalaniladi.':rule.en}</p></div>)}
 </section>
 <section className="mt-11 rounded-[1.6rem] border border-[#e1e9df] bg-white p-5 sm:p-8"><h2 className="flex items-center gap-2 text-xl font-bold"><CalendarDays size={20} className="text-[#2b775e]"/>{uz?'Kundalik gaplar':'Everyday calendar sentences'}</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{calendarExamples.map((ex,i)=><div className="flex items-start justify-between gap-3 rounded-xl bg-[#f4f6f1] p-4" key={i}><div><p className="font-semibold text-[#153e35]">{ex.en}</p><p className="mt-2 text-sm text-slate-600">{ex.uz}</p></div><SpeechButton text={ex.en} slow/></div>)}</div></section>
 {quiz ? <section className="mt-8 rounded-[1.6rem] border border-[#e1e9df] bg-white p-5 sm:p-8">
  <h2 className="text-xl font-bold">{uz?'Tezkor savol':'Quick check'}</h2>
  <p className="mt-3 font-semibold">{uz?`“${quiz.target.en}” nimani anglatadi?`:`What does “${quiz.target.en}” mean in Uzbek?`}</p>
  <div className="mt-4 flex flex-wrap gap-3">
   {quiz.options.map((option,i)=><button type="button" key={`${current.id}-${option.en}`} disabled={choice!==null} aria-pressed={choice===i} onClick={()=>setChoice(i)} className={`rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${choice!==null && i===quiz.correctIndex?'border-green-700 bg-green-50 text-green-900':choice===i?'border-red-600 bg-red-50 text-red-900':'border-slate-300 bg-white hover:border-teal-700'} disabled:cursor-default`}>{option.uz}</button>)}
  </div>
  {choice!==null&&<p role="status" className={`mt-3 font-semibold ${choice===quiz.correctIndex?'text-green-800':'text-red-800'}`}>
    {choice===quiz.correctIndex?<><CheckCircle2 size={16} className="mr-2 inline"/>{uz?'To‘g‘ri!':'Correct!'}</>:(uz?`To‘g‘ri javob: ${quiz.target.uz}`:`Correct answer: ${quiz.target.uz}`)}
  </p>}
 </section> : <p role="status" className="mt-8 rounded-2xl border border-[#e1e9df] bg-white p-5 text-sm text-slate-600">{uz?'Bu bo‘limda hozircha tezkor test uchun yetarli turli so‘zlar yo‘q.':'There are not enough distinct entries for a quick quiz in this section.'}</p>}
 <div className="mt-8"><SpeakingLab lessonId="essential-calendar" prompts={calendarExamples.slice(0,5)}/></div>
 <Link to="/essentials/topics" className="mt-9 inline-flex items-center gap-2 font-semibold text-teal-800"><LibraryBig size={17}/>{uz?'Barcha mavzular':'Explore everyday topics'}<ChevronRight size={17}/></Link>
 </div>;
}
