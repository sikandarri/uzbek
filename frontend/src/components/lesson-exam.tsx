import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookCheck, Clock3, Volume2, RotateCcw, CheckCircle2 } from 'lucide-react';

type Question = {promptEn:string;promptUz:string;options:string[];answer:number;whyEn:string;whyUz:string;audioEn?:string};
type Section = {kind:string;titleEn:string;titleUz:string;questions:Question[]};
type Task={en:string;uz:string;criteriaEn:string[];criteriaUz:string[]};
type WritingTask=Task & {modelEn:string;modelUz:string};
export type LessonExamData={version:string;recommendedMinutes:number;passingPercent:number;sections:Section[];speakingTasks:Task[];writingTask:WritingTask};
type Result={score:number;total:number;percent:number;date:string;sections:Record<string,{correct:number;total:number}>};
const readHistory=(key:string):Result[]=> {try {const records=JSON.parse(localStorage.getItem(key)??'[]') as unknown;return Array.isArray(records)?records.filter((r):r is Result=>Boolean(r && typeof r==='object' && 'score' in r)).slice(0,10):[];}catch{return [];} };

export default function LessonExam({lessonId,exam}:{lessonId:string;exam:LessonExamData}) {
  const {i18n}=useTranslation();const uz=i18n.language!=='en';
  const [started,setStarted]=useState(false);
  const [answers,setAnswers]=useState<Record<string,number>>({});
  const [submitted,setSubmitted]=useState(false);
  const [history,setHistory]=useState<Result[]>([]);
  const [writing,setWriting]=useState('');
  const [showModel,setShowModel]=useState(false);
  const [selfCheck,setSelfCheck]=useState<Record<string,boolean>>({});
  const key=`noldan-exam-v1-${lessonId}`;
  const total=exam.sections.reduce((n,s)=>n+s.questions.length,0);
  const answered=Object.keys(answers).length;
  const correct=exam.sections.reduce((n,s)=>n+s.questions.filter((q,i)=>answers[`${s.kind}:${i}`]===q.answer).length,0);
  const percent=Math.round(100*correct/Math.max(1,total));
  const passing=percent>=exam.passingPercent;
  useEffect(()=>{setStarted(false);setAnswers({});setSubmitted(false);setShowModel(false);setSelfCheck({});setHistory(readHistory(key));
    try{setWriting(localStorage.getItem(`noldan-exam-writing-${lessonId}`)??'');}catch{setWriting('');}
  },[key,lessonId]);
  useEffect(()=>{try{localStorage.setItem(`noldan-exam-writing-${lessonId}`,writing);}catch{/* disabled storage */}},[writing,lessonId]);
  function submit(){
    if (submitted)return;
    const sections=Object.fromEntries(exam.sections.map(s=>[s.kind,{correct:s.questions.filter((q,i)=>answers[`${s.kind}:${i}`]===q.answer).length,total:s.questions.length}]));
    const result={score:correct,total,percent,date:new Date().toISOString(),sections};
    const records=[result,...history].slice(0,10);
    setHistory(records);setSubmitted(true);
    try{localStorage.setItem(key,JSON.stringify(records));}catch{/* storage optional */}
  }
  function audio(text:string){if('speechSynthesis' in window){window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-GB';utterance.rate=.88;window.speechSynthesis.speak(utterance);}}
  function restart(){setAnswers({});setSubmitted(false);setStarted(true);setSelfCheck({});setShowModel(false);}
  const score=history[0];
  return <section className="card mt-7 border-[#c5d8d0]" data-testid="lesson-exam">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><BookCheck className="text-teal-700" size={24}/><h2 className="text-2xl font-semibold text-[#174a3f]">{uz?'Dars yakuniy imtihoni':'End-of-lesson assessment'}</h2></div>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-700">{uz?'Lug‘at, o‘qish, tinglash va ingliz tilidan foydalanish bo‘yicha test, shuningdek ikki og‘zaki va bitta yozma vazifa.':'A structured exam covering vocabulary, reading evidence, listening, English in use, plus two speaking assignments and one writing assignment.'}</p></div>
      <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900"><Clock3 size={15}/>{exam.recommendedMinutes} {uz?'daqiqa tavsiya':'min suggested'}</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><strong className="block text-2xl text-teal-950">{total}</strong><span className="text-xs text-slate-500">{uz?'Avtomatik tekshiriladigan savollar':'Auto-scored questions'}</span></div><div className="rounded-xl bg-slate-50 p-4"><strong className="block text-2xl text-teal-950">2 + 1</strong><span className="text-xs text-slate-500">{uz?'Og‘zaki va yozma vazifalar':'Speaking + writing tasks'}</span></div><div className="rounded-xl bg-slate-50 p-4"><strong className="block text-2xl text-teal-950">{exam.passingPercent}%</strong><span className="text-xs text-slate-500">{uz?'Mashq maqsadi':'Practice benchmark'}</span></div></div>
    <p className="mt-4 text-xs leading-6 text-slate-500">{uz?'Bu sayt tomonidan tayyorlangan mashq imtihoni, rasmiy IELTS/Multilevel sinovi yoki sertifikat emas. Ovozlar brauzer orqali o‘qiladi.':'This is an independently authored practice assessment, not a calibrated IELTS/Multilevel examination or certification. Listening uses browser speech synthesis, not authentic recorded exam audio.'}</p>
    {score && <p className="mt-4 text-sm font-semibold text-teal-800">{uz?'So‘nggi test':'Last attempt'}: {score.score}/{score.total} ({score.percent}%) · {new Date(score.date).toLocaleDateString()}</p>}
    {!started && <button type="button" className="btn mt-5" onClick={()=>setStarted(true)}>{uz?'Imtihonni boshlash':'Start lesson exam'}</button>}
    {started && <>
      <div className="mt-6 flex flex-wrap justify-between gap-2 rounded-xl bg-[#f3f6f1] p-4 text-sm"><strong>{uz?'Javob berilgan':'Answered'}: {answered}/{total}</strong><span>{uz?'Maslahat: javob yuborilgach o‘zgartirib bo‘lmaydi.':'Once submitted, answers are locked.'}</span></div>
      {exam.sections.map((section,sIndex)=><div key={section.kind} className="mt-8"><h3 className="border-b border-teal-200 pb-3 text-xl font-semibold text-teal-950">{sIndex+1}. {uz?section.titleUz:section.titleEn} <span className="ml-2 text-sm font-normal text-slate-500">({section.questions.length})</span></h3>
        {section.kind==='reading' && <p className="mt-3 text-sm text-slate-600">{uz?'Matndagi aniq dalilga qayting; taxmin qilmang.':'Refer to the actual reading passage above; select supported evidence, not assumptions.'}</p>}
        {section.kind==='listening' && <p className="mt-3 text-sm text-slate-600">{uz?'Avval tinglang, keyin tanlang. Javobni topish uchun matn ko‘rsatilmaydi.':'Listen before choosing. The spoken reference is hidden until grading.'}</p>}
        <div className="mt-5 space-y-5">{section.questions.map((q,i)=>{
          const k=`${section.kind}:${i}`; const chosen=answers[k];
          return <fieldset key={k} className="rounded-xl border border-slate-200 p-4 sm:p-5"><legend className="max-w-full px-2 text-sm font-semibold leading-6">{i+1}. {uz?q.promptUz:q.promptEn}</legend>
            {q.audioEn && <button type="button" className="btn-secondary mb-4 mt-3 inline-flex items-center gap-2" onClick={()=>audio(q.audioEn!)}><Volume2 size={16}/>{uz?'Audioni tinglash':'Play the audio'}</button>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{q.options.map((option,j)=><label key={j} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${submitted&&q.answer===j?'border-teal-500 bg-teal-50':submitted&&chosen===j&&chosen!==q.answer?'border-rose-400 bg-rose-50':'border-slate-200 hover:bg-slate-50'}`}><input type="radio" className="mt-1" name={`exam-${lessonId}-${k}`} checked={chosen===j} disabled={submitted} onChange={()=>setAnswers(a=>({...a,[k]:j}))}/><span>{option}</span></label>)}</div>
            {submitted && <p className={`mt-3 rounded-lg p-3 text-sm leading-6 ${chosen===q.answer?'bg-teal-50 text-teal-900':'bg-amber-50 text-amber-900'}`}>{chosen===q.answer?(uz?'To‘g‘ri.':'Correct. '):(uz?'Xato yoki javob berilmagan. ':'Incorrect or unanswered. ')}{uz?q.whyUz:q.whyEn}{q.audioEn&&<span className="mt-2 block font-medium">{uz?'Ovoz matni':'Spoken sentence'}: {q.audioEn}</span>}</p>}
          </fieldset>;
        })}</div></div>)}
      <div className="mt-6 rounded-xl border border-[#b9d5ca] bg-teal-50 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-teal-950">{uz?'Javoblaringizni tekshiring':'Review your responses'}</p><span className="text-sm">{answered}/{total}</span></div>
        {!submitted && <button type="button" className="btn mt-4" onClick={submit}>{uz?'Imtihonni yakunlash va tekshirish':'Submit and grade objective questions'}</button>}
        {submitted && <><div role="status" className="mt-4 flex flex-wrap items-center gap-3"><strong className="text-3xl text-teal-950">{correct}/{total} · {percent}%</strong><span className={passing?'text-teal-800':'text-amber-800'}>{passing?(uz?'Mashq mezoniga yetdi':'Practice benchmark reached'):(uz?'Yana mashq qiling':'Review and try again')}</span></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{exam.sections.map(section=>{const v=score&&history[0]?.sections[section.kind]; return <p key={section.kind} className="rounded-lg bg-white p-3 text-sm">{uz?section.titleUz:section.titleEn}: <strong>{v?.correct ?? 0}/{v?.total ?? section.questions.length}</strong></p>;})}</div>
          <button type="button" className="btn-secondary mt-4 inline-flex items-center gap-2" onClick={restart}><RotateCcw size={16}/>{uz?'Qaytadan urinish':'Start a new attempt'}</button></>}
      </div>
      <div className="mt-8 border-t border-slate-200 pt-6"><h3 className="text-xl font-semibold">{uz?'5. Og‘zaki topshiriqlar':'5. Speaking performance tasks'}</h3><p className="mt-2 text-sm text-slate-600">{uz?'Javoblarni yuqoridagi Guided Speaking mikrofonida mashq qiling va mezonlarni o‘zingiz belgilang. Bu ball avtomatik test natijasiga qo‘shilmaydi.':'Practise these prompts using the Guided Speaking microphone above and apply the checklist. They are not machine-graded or included in the objective score.'}</p>
        {exam.speakingTasks.map((task,i)=><div key={i} className="mt-4 rounded-xl border border-slate-200 p-5"><h4 className="font-semibold">{uz?'Og‘zaki vazifa':'Speaking task'} {i+1}</h4><p className="mt-2 leading-7">{uz?task.uz:task.en}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{(uz?task.criteriaUz:task.criteriaEn).map((criterion,j)=><label key={j} className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={Boolean(selfCheck[`s${i}-${j}`])} onChange={e=>setSelfCheck(old=>({...old,[`s${i}-${j}`]:e.target.checked}))}/>{criterion}</label>)}</div></div>)}
      </div>
      <div className="mt-8 border-t border-slate-200 pt-6"><h3 className="text-xl font-semibold">{uz?'6. Yozma topshiriq':'6. Writing performance task'}</h3><p className="mt-3 text-sm leading-7">{uz?exam.writingTask.uz:exam.writingTask.en}</p>
        <textarea rows={7} value={writing} onChange={e=>setWriting(e.target.value)} aria-label={uz?'Imtihon yozma javobi':'Exam writing response'} className="mt-3 w-full rounded-xl border border-slate-200 p-4 text-sm" placeholder={uz?'Inglizcha javobingizni yozing…':'Write your English response…'}/>
        <p className="mt-2 text-xs text-slate-500">{uz?'So‘zlar soni':'Word count'}: {writing.trim()?writing.trim().split(/\s+/).length:0} · {uz?'Qoralama qurilmangizda saqlanadi.':'Draft saved on your device.'}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{(uz?exam.writingTask.criteriaUz:exam.writingTask.criteriaEn).map((criterion,i)=><label key={i} className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={Boolean(selfCheck[`w${i}`])} onChange={e=>setSelfCheck(old=>({...old,[`w${i}`]:e.target.checked}))}/>{criterion}</label>)}</div>
        <button type="button" className="btn-secondary mt-4" onClick={()=>setShowModel(v=>!v)}>{showModel?(uz?'Namunani yashirish':'Hide reference answer'):(uz?'Namuna bilan solishtirish':'Compare with a reference answer')}</button>
        {showModel && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="whitespace-pre-line leading-7">{exam.writingTask.modelEn}</p><p className="mt-2 text-sm leading-7 text-slate-600">{exam.writingTask.modelUz}</p></div>}
        <p className="mt-4 text-xs text-slate-500">{uz?'Yozish va erkin nutq mezonlari o‘zingizni baholashga yordam beradi; ular rasmiy imtihon natijasi yoki avtomatik ball emas.':'Writing and free speaking require human review for meaningful scoring. Self-checks are not official or automatically awarded marks.'}</p>
      </div>
    </>}
    {history.length>1 && <details className="mt-6 text-sm text-slate-600"><summary className="cursor-pointer font-semibold">{uz?'Avvalgi urinishlar':'Previous exam attempts'} ({history.length})</summary><ul className="mt-3 space-y-2">{history.map((x,i)=><li key={`${x.date}-${i}`} className="flex justify-between rounded-lg bg-slate-50 p-3"><span>{new Date(x.date).toLocaleString()}</span><strong>{x.score}/{x.total} ({x.percent}%)</strong></li>)}</ul></details>}
  </section>;
}
