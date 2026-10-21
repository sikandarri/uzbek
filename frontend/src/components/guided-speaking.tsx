import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle2, Mic, MicOff, Volume2 } from 'lucide-react';

type Pair = { en: string; uz?: string };
type Mission = { id: string; kind: string; en: string; uz: string; minimumSeconds: number };
export type SpeakingExpansion = { repeat: Pair[]; missions: Mission[] };
type SpeechResult = { isFinal: boolean; 0?: { transcript: string } };
type SpeechEvent = { results: ArrayLike<SpeechResult> };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: {error:string}) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export default function GuidedSpeaking({lessonId, expansion}: {lessonId: string; expansion: SpeakingExpansion}) {
  const {i18n} = useTranslation(); const uz = i18n.language !== 'en';
  const [selected, setSelected] = useState(0);
  const [notes, setNotes] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Record<string, boolean>>({});
  const microphone = useRef<Recognition | null>(null);
  const storageKey = `noldan-speaking-missions-v1-${lessonId}`;
  const mission = expansion.missions[selected];
  useEffect(() => {
    try {setDone(JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string,boolean>);} catch {setDone({});}
    return () => {microphone.current?.abort(); microphone.current = null;};
  }, [storageKey]);
  useEffect(() => { try {localStorage.setItem(storageKey,JSON.stringify(done));} catch { /* optional */ } }, [done,storageKey]);
  const stop = () => { microphone.current?.stop(); setListening(false); };
  const switchMission = (next: number) => { microphone.current?.abort();microphone.current=null;setListening(false);setNotes('');setError('');setSelected(next); };
  function record() {
    const Recognizer=(window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Recognizer || !window.isSecureContext) {setError(uz?'Chrome/Edge va HTTPS yoki localhost kerak.':'Speech recognition requires Chrome/Edge and HTTPS or localhost.');return;}
    microphone.current?.abort();
    const r=new Recognizer();microphone.current=r; r.lang='en-GB';r.continuous=true;r.interimResults=true;
    r.onresult=e=>{if(microphone.current!==r)return; const text=Array.from(e.results).map(x=>x[0]?.transcript??'').join(' ').trim();setNotes(text);};
    r.onerror=e=>{setError((uz?'Mikrofon xatosi: ':'Microphone error: ')+e.error);setListening(false);};
    r.onend=()=>{if(microphone.current===r){setListening(false);microphone.current=null;}};
    try{r.start();setListening(true);setError('');}catch{setError(uz?'Mikrofonni ochib bo‘lmadi.':'Could not start the microphone.');}
  }
  if (!mission) return null;
  return <div className="mt-7 rounded-2xl border border-teal-200 bg-teal-50/50 p-5 sm:p-6" data-testid="guided-speaking">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-xl font-semibold text-teal-950">{uz?'Erkin nutq va rolli suhbat':'Guided speaking and role-play'}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{uz?'12 ta yangi og‘zaki topshiriq. O‘zingiz fikr tuzing; mikrofon faqat matnni yozib beradi. Javoblarning mazmuni avtomatik baholanmaydi.':'Twelve original-response tasks based on this lesson. The microphone transcribes your response, but open-ended fluency and accuracy are not automatically graded.'}</p></div>
      <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-teal-800">{Object.values(done).filter(Boolean).length}/{expansion.missions.length} {uz?'bajarildi':'reviewed'}</span>
    </div>
    <div className="mt-5 flex flex-wrap gap-2">{expansion.missions.map((entry,index)=><button type="button" key={entry.id} onClick={()=>switchMission(index)} aria-pressed={index===selected} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${index===selected?'border-teal-800 bg-teal-800 text-white':'border-slate-200 bg-white text-slate-700'}`}>{index+1} {done[entry.id]?'✓':''}</button>)}</div>
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-800">{mission.kind} · {uz?'kamida':'aim for'} {mission.minimumSeconds} {uz?'soniya':'seconds'}</p>
      <p className="mt-3 text-lg font-semibold leading-8 text-slate-900">{uz?mission.uz:mission.en}</p>
      {uz && <p className="mt-2 text-sm leading-7 text-slate-500">{mission.en}</p>}
      <div className="mt-4 flex flex-wrap gap-2"><button className="btn-secondary inline-flex items-center gap-2" type="button" onClick={()=>{if('speechSynthesis' in window){window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(mission.en);utterance.lang='en-GB';utterance.rate=.88;window.speechSynthesis.speak(utterance);}}}><Volume2 size={16}/>{uz?'Savolni tinglash':'Hear the prompt'}</button>
        <button className="btn inline-flex items-center gap-2" type="button" onClick={()=>listening?stop():record()}>{listening?<MicOff size={16}/>:<Mic size={16}/>} {listening?(uz?'To‘xtatish':'Stop transcription'):(uz?'Javobni aytish':'Speak your answer')}</button>
      </div>
      {listening && <p role="status" className="mt-3 text-sm text-teal-700">{uz?'Tinglanmoqda…':'Listening…'}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      <label htmlFor={`mission-${lessonId}`} className="mt-5 block text-sm font-semibold text-slate-700">{uz?'Javobingiz matni (ixtiyoriy)':'Your transcript / speaking notes (optional)'}</label>
      <textarea id={`mission-${lessonId}`} rows={4} value={notes} onChange={e=>setNotes(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder={uz?'Javobingizni yozing yoki mikrofonni ishlating...':'Type a response or use your microphone…'}/>
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">{uz?'O‘zingizni tekshiring: javob mavzuga mosmi, aniq misol bormi, gaplar bog‘langanmi, lug‘atni to‘g‘ri ishlatdingizmi?':'Self-check: Did you address the prompt, give a specific example, connect your ideas, and use relevant words? Do not treat speech recognition as a pronunciation or IELTS score.'}</div>
      <button type="button" className="btn-secondary mt-4 inline-flex items-center gap-2" onClick={()=>setDone(old=>({...old,[mission.id]:!old[mission.id]}))}><CheckCircle2 size={16}/>{done[mission.id]?(uz?'Bajarilgan deb belgilangan':'Marked reviewed'):(uz?'Mashqni bajardim':'Mark as practised')}</button>
    </div>
    <div className="mt-4 flex items-center justify-between"><button type="button" disabled={selected===0} className="btn-secondary inline-flex items-center gap-2 disabled:opacity-40" onClick={()=>switchMission(selected-1)}><ArrowLeft size={16}/>{uz?'Oldingi':'Previous'}</button><button type="button" disabled={selected===expansion.missions.length-1} className="btn-secondary inline-flex items-center gap-2 disabled:opacity-40" onClick={()=>switchMission(selected+1)}>{uz?'Keyingi':'Next'}<ArrowRight size={16}/></button></div>
    <p className="mt-3 text-xs text-slate-500">{uz?'Mashq holati shu qurilmada saqlanadi. Ovoz fayli saqlanmaydi.':'Completion is stored only on this device. No audio recording is saved by this site.'}</p>
  </div>;
}
