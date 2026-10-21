import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, RotateCcw, Volume2, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { bestSpeechAlternative, gradeSpeech, type SpeechMatch } from '../lib/speech-score';

type Prompt = { en: string; uz?: string };
type SpeechAlternative = { transcript: string; confidence: number };
type SpeechResult = { isFinal: boolean; length: number; [index: number]: SpeechAlternative };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type RecognitionError = { error: string; message?: string };
type Recognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognizer;
  webkitSpeechRecognition?: new () => Recognizer;
};
type SavedResult = { score: number; attempts: number };

function readSaved(key: string): Record<number, SavedResult> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const safe: Record<number, SavedResult> = {};
    for (const [index, score] of Object.entries(parsed)) {
      if (typeof score === 'object' && score !== null &&
          typeof (score as SavedResult).score === 'number' &&
          typeof (score as SavedResult).attempts === 'number')
        safe[Number(index)] = { score: (score as SavedResult).score, attempts: (score as SavedResult).attempts };
    }
    return safe;
  } catch { return {}; }
}

export default function SpeakingLab({ lessonId, prompts }: { lessonId: string; prompts: Prompt[] }) {
  const { i18n } = useTranslation();
  const uz = i18n.language !== 'en';
  const [selected, setSelected] = useState(0);
  const [accent, setAccent] = useState<'en-GB' | 'en-US'>('en-GB');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [result, setResult] = useState<SpeechMatch | null>(null);
  const [issue, setIssue] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [correctedTranscript, setCorrectedTranscript] = useState('');
  const [reviewedScore, setReviewedScore] = useState<SpeechMatch | null>(null);
  const finalRef = useRef<string[]>([]);
  const interimRef = useRef('');
  const storageKey = `noldan-speech-v1-${lessonId}`;
  const [saved, setSaved] = useState<Record<number, SavedResult>>(() => readSaved(storageKey));
  const recognizer = useRef<Recognizer | null>(null);
  const target = prompts[selected];

  const recognitionAvailable = typeof window !== 'undefined' &&
    Boolean((window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition);

  useEffect(() => () => { recognizer.current?.abort(); recognizer.current = null; }, []);
  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* private browsing can disable storage */ }
  }, [saved, storageKey]);

  if (!prompts.length || !target) return null;

  function saveResult(index: number, value: SpeechMatch) {
    setSaved(previous => {
      const old = previous[index];
      return { ...previous, [index]: {
        score: Math.max(old?.score ?? 0, value.score), attempts: (old?.attempts ?? 0) + 1,
      } };
    });
  }
  function choose(index: number) {
    recognizer.current?.abort(); recognizer.current = null;
    setListening(false); setSelected(index); setTranscript(''); setInterim(''); setResult(null); setIssue(''); setEditOpen(false); setCorrectedTranscript(''); setReviewedScore(null); finalRef.current = []; interimRef.current = '';
  }
  function listenToModel() {
    if (!('speechSynthesis' in window)) {
      setIssue(uz ? 'Ovoz chiqarib o‘qish bu brauzerda mavjud emas.' : 'Text to speech is not available in your browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(target!.en); voice.lang = accent; voice.rate = 0.82;
    window.speechSynthesis.speak(voice);
  }
  function start() {
    const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Speech) {
      setIssue(uz ? 'Nutqni tanish bu brauzerda mavjud emas. Chrome yoki Edge’dan foydalaning.' : 'Speech recognition is unavailable here. Try current Chrome or Edge.');
      return;
    }
    if (!window.isSecureContext) {
      setIssue(uz ? 'Mikrofon uchun HTTPS yoki localhost kerak.' : 'Microphone access requires HTTPS or localhost.');
      return;
    }
    recognizer.current?.abort();
    const r = new Speech(); recognizer.current = r;
    r.lang = accent; r.continuous = true; r.interimResults = true; r.maxAlternatives = 5;
    setIssue(''); setResult(null); setTranscript(''); setInterim(''); setEditOpen(false); setCorrectedTranscript(''); setReviewedScore(null); finalRef.current = []; interimRef.current = '';
    r.onresult = (event: RecognitionEvent) => {
      if (recognizer.current !== r) return;
      const completed: string[] = [];
      let tentative = '';
      for (let i = 0; i < event.results.length; i++) {
        const chunk = event.results[i];
        if (!chunk) continue;
        const alternatives: string[] = [];
        // Some engines provide several transcripts; use the one that best matches
        // the known reference instead of blindly trusting only result[0].
        for (let a = 0; a < Math.min(5, chunk.length ?? 1); a++) {
          const text = chunk[a]?.transcript?.trim();
          if (text) alternatives.push(text);
        }
        const candidate = bestSpeechAlternative(target!.en, alternatives).transcript;
        if (chunk.isFinal) completed.push(candidate);
        else tentative += `${candidate} `;
      }
      finalRef.current = completed;
      interimRef.current = tentative.trim();
      setInterim([completed.join(' '), tentative.trim()].filter(Boolean).join(' '));
    };
    r.onerror = ({ error }: RecognitionError) => {
      if (recognizer.current !== r) return;
      const messages: Record<string, [string,string]> = {
        'not-allowed': ['Microphone permission was denied. Enable it in browser settings.','Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.'],
        'no-speech': ['No speech detected. Try again in a quieter place.','Nutq aniqlanmadi. Tinchroq joyda qayta urinib ko‘ring.'],
        'network': ['The browser recognition service is offline or blocked. Check internet access.','Brauzer nutqni tanish xizmatiga ulanolmadi. Internetni tekshiring.'],
        'audio-capture': ['No working microphone found.','Ishlaydigan mikrofon topilmadi.'],
        'service-not-allowed': ['Your browser blocked the speech recognition service.','Brauzer nutqni tanish xizmatini blokladi.'],
      };
      setIssue((messages[error] ?? ['Speech recognition failed. Please retry.','Nutqni aniqlashda xatolik. Qayta urinib ko‘ring.'])[uz ? 1 : 0]!);
      setListening(false);
    };
    r.onend = () => {
      if (recognizer.current !== r) return;
      const recognized = (finalRef.current.join(' ') || interimRef.current).trim();
      if (recognized) {
        const grade = gradeSpeech(target!.en, recognized);
        setTranscript(recognized);
        setResult(grade);
        setCorrectedTranscript(recognized);
        saveResult(selected, grade);
      } else {
        setIssue(previous => previous || (uz
          ? 'Hech qanday nutq yozib olinmadi. Mikrofon va internetni tekshiring.'
          : 'No speech was transcribed. Check the microphone and connection, then retry.'));
      }
      setListening(false); recognizer.current = null; setInterim('');
    };
    try { r.start(); setListening(true); }
    catch { setIssue(uz ? 'Mikrofonni ishga tushirib bo‘lmadi.' : 'Unable to start the microphone.'); setListening(false); }
  }
  const spokenCount = Object.keys(saved).length;
  const mean = spokenCount ? Math.round(Object.values(saved).reduce((n, r) => n + r.score, 0) / spokenCount) : 0;
  return <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-lg font-semibold text-teal-950 flex items-center gap-2"><Mic size={19}/>{uz ? 'Nutqni tanish va baholash' : 'Speak, recognize and score'}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{uz
          ? 'Namunaviy gapni tinglang, mikrofonni yoqing va aynan shu gapni inglizcha ayting. Brauzer aytganingizni matnga aylantirib, namuna bilan solishtiradi.'
          : 'Listen to a target sentence, activate your microphone, and speak the sentence in English. Your browser transcribes your speech and compares its text with the model. Say the whole sentence, then tap Stop and score. Numbers and Uzbek so‘m spellings are normalized; incorrect quantities are not ignored.'}</p></div>
      <div className="flex flex-col items-end gap-2"><div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-900">{spokenCount}/{prompts.length} {uz ? 'mashq bajarildi' : 'attempted'}{spokenCount > 0 && <div className="text-xs font-normal">{uz ? 'Eng yaxshi natijalar o‘rtachasi' : 'Average best score'}: {mean}/100</div>}</div>
      <div className="flex gap-1 rounded-lg border border-teal-200 bg-white p-1" role="group" aria-label={uz?'Inglizcha talaffuz varianti':'English accent preference'}>
        {([['en-GB','UK'],['en-US','US']] as const).map(([lang,label]) => <button type="button" key={lang} aria-pressed={accent === lang} onClick={() => { if (!listening) setAccent(lang); }} disabled={listening} className={`rounded-md px-3 py-1 text-xs font-semibold ${accent===lang?'bg-teal-800 text-white':'text-teal-800'}`}>{label}</button>)}
      </div></div>
    </div>
    <div className="mt-5 flex flex-wrap gap-2" aria-label={uz ? 'Gapni tanlash' : 'Select a practice sentence'}>
      {prompts.map((_,i)=><button key={i} type="button" onClick={()=>choose(i)} aria-pressed={selected===i}
        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${selected===i?'border-teal-700 bg-teal-800 text-white':'border-slate-200 bg-white text-teal-900 hover:border-teal-600'}`}>
        {uz ? 'Gap' : 'Sentence'} {i+1}{saved[i] ? ` · ${saved[i].score}` : ''}</button>)}
    </div>
    <div className="mt-5 rounded-xl border border-teal-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{uz ? 'Aytilishi kerak bo‘lgan gap' : 'Your target sentence'}</p>
      <p className="mt-2 text-lg font-semibold leading-8 text-slate-900">{target.en}</p>
      {target.uz && <p className="mt-1 text-sm text-slate-500">{target.uz}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={listenToModel}><Volume2 size={17}/>{uz?'Tinglash':'Listen'}</button>
        <button type="button" className="btn inline-flex items-center gap-2" disabled={!recognitionAvailable && !listening} onClick={() => listening ? recognizer.current?.stop() : start()}>
          {listening ? <MicOff size={17}/> : <Mic size={17}/>}{listening ? (uz?'Tugatish va baholash':'Stop and score') : (uz?'Gapirishni boshlash':'Start speaking')}
        </button>
        {selected < prompts.length-1 && <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={()=>choose(selected+1)}>{uz?'Keyingi gap':'Next sentence'} <ArrowRight size={17}/></button>}
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={()=>choose(selected)}><RotateCcw size={17}/>{uz?'Qayta urinish':'Try again'}</button>
      </div>
      {listening && <p role="status" className="mt-3 text-sm font-semibold text-teal-700">{uz?'Mikrofon tinglamoqda… Gapiring.':'Listening… Speak now.'} {interim && <span className="font-normal">{interim}</span>}</p>}
      {!recognitionAvailable && <p className="mt-3 text-sm text-amber-800">{uz?'Bu brauzerda nutqni tanish mavjud emas. So‘nggi Chrome yoki Edge brauzerini ishlating.':'Speech recognition is not supported by this browser. Try the latest Chrome or Edge.'}</p>}
      {issue && <p className="mt-3 text-sm text-amber-800" role="alert">{issue}</p>}
      {result && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{uz?'Brauzer tanigan gap':'Recognized words'}</p>
        <p className="mt-1 break-words text-base leading-7">{transcript}</p>
        <div className="mt-4 flex items-center gap-3"><span className={`text-4xl font-bold tabular-nums ${result.score>=80?'text-teal-700':result.score>=50?'text-amber-700':'text-rose-700'}`}>{result.score}<span className="text-xl">/100</span></span>
        <span className="text-sm text-slate-700">{uz?'So‘zlar mosligi':'Word-match score'}<span className="block text-xs text-slate-500">{result.correct}/{result.targetCount} {uz?'so‘z mos keldi':'words matched'}</span></span>{result.score>=85 && <CheckCircle2 className="text-teal-700" size={24}/>}</div>
        {result.missed.length > 0 && <p className="mt-3 text-sm text-rose-800">{uz?'Yetishmagan yoki o‘zgargan so‘zlar':'Missing or different target words'}: <strong>{result.missed.join(' · ')}</strong></p>}
        {result.added.length > 0 && <p className="mt-2 text-sm text-amber-800">{uz?'Qo‘shimcha yoki boshqacha so‘zlar':'Additional or different recognized words'}: <strong>{result.added.join(' · ')}</strong></p>}
        <p className="mt-3 text-sm text-slate-600">{result.score>=90 ? (uz?'Ajoyib! Yana bir bor aniq ayting.':'Great match. Try again for consistency.') : result.score>=65 ? (uz?'Yaxshi. Farqli so‘zlarni qayta mashq qiling.':'Good progress. Review the different words and retry.') : (uz?'Namunani tinglang, sekinroq gapiring va qayta urinib ko‘ring.':'Listen to the model, speak clearly, and try again.')}</p>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <button type="button" className="text-sm font-semibold text-teal-800 underline underline-offset-4" onClick={() => {setEditOpen(!editOpen); setReviewedScore(null);}}>
            {uz ? 'Brauzer so‘zlarni noto‘g‘ri eshitdimi? Matnni tekshirish' : 'Did the browser mishear you? Review transcription'}
          </button>
          {editOpen && <div className="mt-3 space-y-3">
            <label className="block text-sm font-medium" htmlFor={`review-${lessonId}`}>{uz ? 'Tuzatilgan matn' : 'Corrected transcript'}</label>
            <textarea id={`review-${lessonId}`} className="w-full rounded-xl border border-slate-300 p-3 text-sm" rows={2} value={correctedTranscript} onChange={e => {setCorrectedTranscript(e.target.value); setReviewedScore(null);}} />
            <button type="button" className="btn-secondary" onClick={() => setReviewedScore(gradeSpeech(target!.en, correctedTranscript))}>{uz ? 'Matnni qayta solishtirish' : 'Compare corrected text'}</button>
            {reviewedScore && <p className="text-sm text-teal-900">{uz ? 'Qo‘lda tuzatilgan matn mosligi' : 'Manually corrected text match'}: <strong>{reviewedScore.score}/100</strong>. {uz ? 'Bu mikrofon bahosi emas va eng yaxshi ballga qo‘shilmaydi.' : 'This is not a microphone score and is not saved as an attempt.'}</p>}
          </div>}
        </div>
      </div>}
    </div>
    <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-slate-600"><Info size={15} className="mt-1 shrink-0"/>
      {uz
       ? 'Ball faqat brauzer aniqlagan so‘zlarning namunaga mosligidir. Bu grammatika, aksent, talaffuz sifati yoki IELTS/CEFRning rasmiy bali emas. Sayt ovozingizni saqlamaydi; brauzer nutqni tanish uchun uchinchi tomon xizmatidan foydalanishi mumkin. Natijalar shu qurilmada saqlanadi. HTTPS yoki localhost va mikrofon ruxsati kerak.'
       : 'The score uses the closest browser speech-recognition hypothesis, so it is only approximate. Recognition can mishear words even when pronunciation is correct; check and edit the transcript if needed. It does not grade grammar, accent, pronunciation quality, or official IELTS/CEFR performance. This site does not store your audio; your browser may use a third-party speech service. Scores stay on this device. HTTPS or localhost and microphone permission are required.'}
    </p>
  </div>;
}
