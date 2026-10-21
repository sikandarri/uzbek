import { useEffect, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, BookA, Hash, Languages, MessageSquareText, Search, Volume2, Sparkles, CheckCircle2, CalendarDays, LibraryBig } from 'lucide-react';
import { alphabet, numbers, phraseGroups, vocabularyGroups, usefulWordGroups, type Group } from '../data/essentials';
import SpeakingLab from '../components/speaking-lab';
import { everydayTopics, everydayWordTotal } from '../data/everyday-topics';
import { calendarTotal } from '../data/calendar';

const sections = [
  {slug:'alphabet', icon:BookA, en:'English alphabet', uz:'Ingliz alifbosi', subEn:'26 letters · letter names · everyday examples', subUz:'26 harf · talaffuz · oddiy misollar', stat:'A–Z'},
  {slug:'numbers', icon:Hash, en:'Numbers and counting', uz:'Sonlar va sanash', subEn:'0–100 and useful larger numbers', subUz:'0–100 va katta sonlar', stat:'0–1M'},
  {slug:'useful-words', icon:Sparkles, en:'Useful words', uz:'Eng kerakli so‘zlar', subEn:'Essential verbs, questions and linking words', subUz:'Muhim fe’llar, savol va bog‘lovchi so‘zlar', stat:'80'},
  {slug:'phrases', icon:MessageSquareText, en:'Useful phrases', uz:'Foydali iboralar', subEn:'120 practical sentences across everyday situations', subUz:'120 ta kundalik gap va ularning o‘zbekcha tarjimasi', stat:String(phraseGroups.reduce((n,g)=>n+g.words.length,0))},
  {slug:'vocabulary', icon:Languages, en:'Core everyday vocabulary', uz:'Asosiy kundalik so‘zlar', subEn:'11 starter topic collections with audio', subUz:'11 ta boshlang‘ich mavzu va ovozli mashqlar', stat:'132'},
  {slug:'calendar', icon:CalendarDays, en:'Days, months & time', uz:'Hafta, oylar va vaqt', subEn:'7 days, 12 months, seasons and daily schedules', subUz:'Hafta kunlari, oylar, fasllar va soat', stat:`${calendarTotal}`},
  {slug:'topics', icon:LibraryBig, en:'Everyday topic library', uz:'Kundalik mavzular kutubxonasi', subEn:`${everydayTopics.length} new collections · ${everydayWordTotal} words · examples and quizzes`, subUz:`${everydayTopics.length} yangi mavzu · ${everydayWordTotal} so‘z · misollar va testlar`, stat:`${everydayTopics.length}`},
] as const;

function say(text:string, setMessage:(x:string)=>void) {
  if (!('speechSynthesis' in window)) {setMessage('Audio is unavailable in this browser.'); return;}
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB'; utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
  setMessage('');
}
function CardText({en,uz}: {en:string;uz:string}) {
  return <><strong className="block text-base text-[#173a37]">{en}</strong><span className="mt-1 block text-sm text-slate-500">{uz}</span></>;
}
export function EssentialsPage() {
  const { section } = useParams();
  const { i18n } = useTranslation();
  const uz = i18n.language !== 'en';
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [message,setMessage] = useState('');
  const [showQuiz,setShowQuiz] = useState(false);
  const [quizAnswer,setQuizAnswer] = useState<number|null>(null);
  const selected = sections.find(x=>x.slug===section);
  const allGroups:Group[] = section==='phrases' ? phraseGroups : section==='useful-words' ? usefulWordGroups : vocabularyGroups;
  const groups = allGroups.filter(g=>topic==='all' || g.id===topic);
  const matches = (en:string,uzText:string)=>`${en} ${uzText}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim());
  const wordTotal = vocabularyGroups.reduce((n,g)=>n+g.words.length,0);
  const phraseTotal = phraseGroups.reduce((n,g)=>n+g.words.length,0);
  const usefulTotal = usefulWordGroups.reduce((n,g)=>n+g.words.length,0);
  const progressId = section ?? 'overview';
  useEffect(() => { setSearch(''); setTopic('all'); setShowQuiz(false); setQuizAnswer(null); }, [section]);
  return <main className="mx-auto max-w-7xl px-5 pb-24 pt-9 lg:px-8">
    <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-xs font-semibold text-slate-500"><Link className="hover:text-teal-700" to="/">{uz?'Bosh sahifa':'Home'}</Link><ArrowRight size={13}/><Link className="hover:text-teal-700" to="/essentials">{uz?'Asoslar':'Learning essentials'}</Link>{selected&&<><ArrowRight size={13}/><span className="text-teal-800">{uz?selected.uz:selected.en}</span></>}</nav>
    {!selected ? <>
      <div className="essentials-hero relative overflow-hidden rounded-[2rem] p-8 text-white sm:p-12 lg:p-16">
        <div className="relative z-10 max-w-2xl"><span className="premium-kicker text-amber-200"><Sparkles size={14} className="inline mr-2"/>{uz?'BIRINCHI QADAM':'START HERE'}</span>
          <h1 className="mt-5 font-editorial text-5xl leading-[1.08] sm:text-6xl">{uz?'Ingliz tili asoslari.':'Build a stronger foundation.'}</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/75">{uz?'Alifbo, sonlar, zarur iboralar va kundalik so‘zlarni tartib bilan o‘rganing. Har bir kartani ovoz chiqarib tinglash mumkin.':'A personal language toolkit: letters, counting, real-life phrases and everyday vocabulary. Listen, learn and practise at your own pace.'}</p>
          <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium text-white/70"><span className="rounded-full border border-white/25 px-4 py-2">26 {uz?'harf':'letters'}</span><span className="rounded-full border border-white/25 px-4 py-2">{phraseTotal} {uz?'ibora':'phrases'}</span><span className="rounded-full border border-white/25 px-4 py-2">{wordTotal+usefulTotal+everydayWordTotal+calendarTotal} {uz?'so‘z va ibora':'words & expressions'}</span></div>
        </div><div aria-hidden="true" className="essentials-orbit"><span>A</span><span>24</span><span>Hello</span></div>
      </div>
      <div className="mt-7 rounded-2xl border border-[#dce6d9] bg-white px-5 py-5 sm:px-7">
        <p className="premium-kicker">{uz?'TAVSIYA ETILGAN O‘QUV YO‘LI':'RECOMMENDED STUDY ROUTE'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1f5647]">
          {[["alphabet",uz?'Alifbo':'Alphabet'],["numbers",uz?'Sonlar':'Numbers'],["calendar",uz?'Vaqt va sana':'Calendar'],["topics",uz?'Kundalik mavzular':'Daily topics'],["phrases",uz?'Suhbat iboralari':'Phrases']].map(([slug,title],i)=><div key={slug} className="inline-flex items-center gap-2"><Link className="rounded-full bg-[#edf5ee] px-3 py-2 hover:bg-[#d9ebe0]" to={`/essentials/${slug}`}>{i+1}. {title}</Link>{i<4&&<ArrowRight size={12} className="text-[#c2a273]"/>}</div>)}
        </div>
        <p className="mt-3 text-xs leading-6 text-slate-500">{uz?'Har kuni 10–15 daqiqa tinglang, yangi so‘zlarni takrorlang va gapirish mashqini bajaring.':'Try 10–15 minutes a day: listen, review the meanings and repeat a sentence aloud.'}</p>
      </div>
      <div className="mt-9 grid gap-5 sm:grid-cols-2">{sections.map((s,i)=><Link key={s.slug} to={`/essentials/${s.slug}`} className="group essentials-tile flex flex-col justify-between gap-8 rounded-[1.5rem] border border-[#e5e9e0] bg-white p-7 sm:p-8"><div className="flex items-start justify-between"><span className="essentials-icon"><s.icon size={26}/></span><span className="font-editorial text-3xl text-teal-800/70">{s.stat}</span></div><div><h2 className="text-2xl font-semibold tracking-tight">{uz?s.uz:s.en}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{uz?s.subUz:s.subEn}</p><div className="mt-6 flex items-center gap-2 text-sm font-bold text-teal-800">{uz?'Mashg‘ulotni ochish':'Explore section'} <ArrowRight size={17} className="transition-transform group-hover:translate-x-1"/></div></div></Link>)}</div>
    </>:<>
      <div className="flex flex-wrap items-end justify-between gap-5"><div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-teal-800"><selected.icon size={17}/>{uz?'Mustaqil o‘rganish':'Self-study essentials'}</div><h1 className="font-editorial mt-3 text-4xl sm:text-5xl">{uz?selected.uz:selected.en}</h1><p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{uz?selected.subUz:selected.subEn}</p></div><Link to="/essentials" className="btn-secondary"><ArrowLeft size={16}/>{uz?'Barcha bo‘limlar':'All sections'}</Link></div>
      <div className="mt-7 flex flex-wrap gap-2 border-b border-[#dae3dc] pb-5">{sections.map(s=><NavLink key={s.slug} to={`/essentials/${s.slug}`} className={({isActive})=>`rounded-full px-4 py-2 text-xs font-semibold transition ${isActive?'bg-[#163c38] text-white':'bg-white text-slate-600 hover:bg-teal-50'}`}>{uz?s.uz:s.en}</NavLink>)}</div>
      {section==='alphabet' && <>
        <div className="mt-8 rounded-2xl bg-[#eaf4ef] p-5 text-sm leading-7 text-[#244f47]"><strong>{uz?'Talaffuz bo‘yicha maslahat':'Pronunciation tip'}:</strong> {uz?'Harfning nomi va so‘z ichidagi tovushi farq qiladi. Harfni va namunaviy so‘zni alohida tinglang. Z harfi britancha “zed”, amerikancha “zee” deyiladi.':'The name of a letter can differ from its sound in a word. Play both the letter and the example. In UK English, Z is “zed”; in US English, “zee”.'}</div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{alphabet.map(([letter,pronunciation,example,meaning])=><article className="essentials-tile rounded-2xl border border-[#e0e8df] bg-white p-5" key={letter}><div className="flex items-center justify-between"><span className="font-editorial text-5xl text-[#174b42]">{letter}<span className="ml-1 align-bottom text-base text-slate-400">{letter.toLowerCase()}</span></span><button type="button" aria-label={`Hear ${letter}`} className="sound-button" onClick={()=>say(letter,setMessage)}><Volume2 size={16}/></button></div><div className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#b08b46]">/{pronunciation}/</div><div className="mt-3"><CardText en={example} uz={meaning}/></div><button type="button" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-teal-700" onClick={()=>say(example,setMessage)}><Volume2 size={13}/>{uz?'So‘zni tinglash':'Hear example'}</button></article>)}</div>
        <SpeakingLab lessonId="essential-alphabet" prompts={[{en:'A is for apple.',uz:'A harfi apple so‘zida ishlatiladi.'},{en:'B is for book.',uz:'B harfi book so‘zida ishlatiladi.'},{en:'C is for city.',uz:'C harfi city so‘zida ishlatiladi.'},{en:'D is for door.',uz:'D harfi door so‘zida ishlatiladi.'}]}/>
      </>}
      {section==='numbers' && <>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">{uz?'Sonni bosing va inglizcha aytilishini eshiting.':'Select any number to hear its English pronunciation.'}</p><button type="button" className="btn-secondary" onClick={()=>{setShowQuiz(!showQuiz);setQuizAnswer(null);}}>{showQuiz?(uz?'Mashqni yopish':'Close quick check'):(uz?'Tezkor savol':'Quick check')}</button></div>
        {showQuiz && <div className="mt-5 max-w-xl rounded-2xl border border-teal-200 bg-teal-50 p-5"><p className="font-semibold">{uz?'“Seventy-four” qaysi son?':'Which number is “seventy-four”?'}</p><div className="mt-4 flex gap-3">{[47,74,84].map((n,i)=><button key={n} type="button" className={`rounded-xl border px-5 py-3 text-sm font-semibold ${quizAnswer===i?'border-teal-700 bg-teal-800 text-white':'border-slate-300 bg-white'}`} onClick={()=>setQuizAnswer(i)}>{n}</button>)}</div>{quizAnswer!==null && <p className="mt-3 text-sm font-semibold">{quizAnswer===1?<><CheckCircle2 size={16} className="inline mr-1"/>{uz?'To‘g‘ri!':'Correct!'}</>:(uz?'Qayta urinib ko‘ring.':'Try again.')}</p>}</div>}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{numbers.map(({n,en,uz:meaning})=><button type="button" key={n} onClick={()=>say(en,setMessage)} className="essentials-tile group rounded-2xl border border-[#e0e8df] bg-white p-4 text-left"><span className="mb-4 flex items-center justify-between"><strong className="font-editorial text-3xl text-teal-900">{n.toLocaleString('en-US')}</strong><Volume2 size={16} className="text-teal-700"/></span><span className="block text-sm font-semibold leading-6">{en}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{meaning}</span></button>)}</div>
        <SpeakingLab lessonId="essential-numbers" prompts={[{en:'I have twenty one books.',uz:'Menda yigirma bitta kitob bor.'},{en:'The jacket costs two hundred som.',uz:'Kurtka ikki yuz so‘m turadi.'},{en:'We need seventy four tickets.',uz:'Bizga yetmish to‘rtta chipta kerak.'}]}/>
      </>}
      {(section==='phrases'||section==='vocabulary'||section==='useful-words') && <>
        <div className="mt-7 flex flex-wrap gap-4"><label className="relative block min-w-[220px] flex-1"><Search size={18} className="pointer-events-none absolute left-4 top-3.5 text-slate-400"/><span className="sr-only">{uz?'Qidirish':'Search'}</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={uz?'Inglizcha yoki o‘zbekcha qidirish':'Search English or Uzbek'} className="w-full !pl-11"/></label><select aria-label={uz?'Mavzu':'Topic'} value={topic} onChange={e=>setTopic(e.target.value)} className="min-w-[220px]"><option value="all">{uz?'Barcha mavzular':'All topics'}</option>{allGroups.map(g=><option key={g.id} value={g.id}>{uz?g.uz:g.en}</option>)}</select></div>
        <div className="mt-8 space-y-9">{groups.map(g=>{const words=g.words.filter(w=>matches(w.en,w.uz)); if(!words.length)return null;return <section key={g.id} aria-label={g.en}><div className="mb-4 flex items-center justify-between"><div><p className="premium-kicker">{section==='phrases'?(uz?'IBORALAR':'PRACTICAL PHRASES'):(uz?'LUG‘AT':'WORD COLLECTION')}</p><h2 className="mt-2 text-xl font-semibold">{uz?g.uz:g.en}</h2></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{words.length} {uz?'ta':'items'}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{words.map(w=><article key={w.en} className="essentials-tile flex items-start justify-between gap-3 rounded-2xl border border-[#e0e8df] bg-white px-5 py-4"><CardText en={w.en} uz={w.uz}/><button type="button" className="sound-button shrink-0" aria-label={`Hear ${w.en}`} onClick={()=>say(w.en,setMessage)}><Volume2 size={17}/></button></article>)}</div></section>})}</div>
        {!groups.some(g=>g.words.some(w=>matches(w.en,w.uz)))&&<p className="mt-8 rounded-xl bg-white p-8 text-center text-slate-500">{uz?'Mos so‘z topilmadi.':'No matching words found.'}</p>}
        <div className="mt-9"><SpeakingLab key={progressId+'-'+topic} lessonId={`essential-${progressId}-${topic}`} prompts={(topic==='all'?allGroups[0]!.words:allGroups.find(g=>g.id===topic)?.words??[]).slice(0,5).map(w=>({en: section!=='phrases'?`Please say the word ${w.en}.`:w.en,uz:w.uz}))}/></div>
      </>}
    </>}
    {message&&<p role="status" className="mt-5 text-sm text-amber-800">{message}</p>}
    <div className="mt-12 flex items-center justify-between border-t border-[#dce5dc] pt-7"><Link to="/essentials" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800"><ArrowLeft size={16}/>{uz?'O‘rganish asoslari':'Learning essentials'}</Link><Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800">{uz?'To‘liq kurslar':'Explore full courses'}<ArrowRight size={16}/></Link></div>
  </main>;
}
