import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, CheckCircle2, Volume2, Clock3 } from 'lucide-react';
import { request } from '../lib/api';
import { Loading, ErrorState } from '../components/ui';
import type { LessonDetails } from '../../../shared/src/contracts';
import SpeakingLab from '../components/speaking-lab';
import GuidedSpeaking, { type SpeakingExpansion } from '../components/guided-speaking';
import LessonExam, { type LessonExamData } from '../components/lesson-exam';

type Pair = { en: string; uz: string };
type MCQ = { promptEn: string; promptUz: string; options: string[]; answer: number; whyEn: string; whyUz: string };
type StudyGuide = { grammar: Pair; task: Pair; model: Pair; pitfall: Pair };
type Teaching = { [key: string]: unknown; items?: Pair[]; examples?: Pair[]; questions?: MCQ[]; drills?: Pair[]; studyGuide?: StudyGuide; speakingExpansion?: SpeakingExpansion; lessonExam?: LessonExamData };
const string = (value: unknown) => typeof value === 'string' ? value : '';

export default function LessonPage() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const uz = i18n.language !== 'en';
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [draft, setDraft] = useState<{lessonId: string; text: string}>({lessonId: '', text: ''});
  const written = draft.lessonId === id ? draft.text : '';
  const setWritten = (text: string) => setDraft({lessonId: id ?? '', text});
  const [readOutMessage, setReadOutMessage] = useState('');
  const [showExamTranscript, setShowExamTranscript] = useState(false);
  const [previous, setPrevious] = useState<string | null>(null);
  useEffect(() => {
    setAnswers({}); setChecked(false); setShowModel(false); setShowExamTranscript(false);
    try { setDraft({lessonId: id ?? '', text: window.localStorage.getItem(`noldan-writing-${id}`) ?? ''}); }
    catch { setDraft({lessonId: id ?? '', text: ''}); }
    try {
      const stored = window.localStorage.getItem(`noldan-practice-${id}`);
      const v = stored ? JSON.parse(stored) as { score: number; total: number } : null;
      setPrevious(v ? `${v.score}/${v.total}` : null);
    } catch { setPrevious(null); }
  }, [id]);
  useEffect(() => {
    if (!id || draft.lessonId !== id) return;
    // Text stays on this device; it is not sent to the API.
    try { window.localStorage.setItem(`noldan-writing-${id}`, draft.text); } catch { /* storage optional */ }
  }, [id, draft]);
  const writtenCount = written.trim() ? written.trim().split(/\s+/u).length : 0;
  const locale = i18n.language;
  const q = useQuery({
    queryKey: ['study', id, locale],
    queryFn: () => request<LessonDetails>(`/lessons/${id}?locale=${locale}`),
    enabled: !!id,
    staleTime: 60_000,
  });
  if (q.isPending) return <Loading />;
  if (q.isError) return <div className="mx-auto max-w-4xl px-5 py-10"><ErrorState error={q.error} retry={() => void q.refetch()} /></div>;
  const lesson = q.data;
  const isExamPractice = lesson.courseSlug.startsWith('ielts-') || lesson.courseSlug.startsWith('multilevel-');
  const isListeningPractice = isExamPractice && /listening|seminar/i.test(lesson.title + ' ' + lesson.moduleTitle);
  const quizBlock = lesson.blocks.find(b => b.type === 'QUESTION');
  const questions = (quizBlock?.content as Teaching | undefined)?.questions ?? [];
  const lessonExam = (quizBlock?.content as Teaching | undefined)?.lessonExam;
  const grade = questions.reduce((total, item, i) => total + (answers[i] === item.answer ? 1 : 0), 0);

  const speak = (text: string) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setReadOutMessage(uz ? 'Brauzerda ovozli o‘qish ishlamaydi.' : 'Text to speech is unavailable in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = 'en-GB'; voice.rate = 0.88;
    window.speechSynthesis.speak(voice);
    setReadOutMessage(uz ? 'Brauzer ovozi yordamida o‘qilmoqda.' : 'Reading with your browser voice.');
  };
  const finish = () => {
    setChecked(true);
    // The study checkpoint is intentionally device-local; no server-side enrollment/progress is implied.
    if (questions.length && Object.keys(answers).length === questions.length) {
      try { window.localStorage.setItem(`noldan-practice-${lesson.id}`, JSON.stringify({
        score: grade, total: questions.length, at: new Date().toISOString(),
      })); setPrevious(`${grade}/${questions.length}`); } catch { /* Private browsing may disable storage */ }
    }
  };
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
      <Link to={`/courses/${lesson.courseSlug}`} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-teal-700"><ArrowLeft size={16}/>{uz ? 'Kursga qaytish' : 'Back to course'}</Link>
      <div className="premium-hero relative overflow-hidden rounded-[2rem] p-7 text-white shadow-lg sm:p-10">
        <div className="flex flex-wrap items-center gap-3 text-xs text-teal-100"><BookOpen size={15}/>{lesson.courseName}<span>·</span>{lesson.moduleTitle}<span>·</span><Clock3 size={14}/>{lesson.estimatedMinutes} min</div>
        <h1 className="font-editorial mt-5 text-4xl leading-tight sm:text-5xl">{lesson.title}</h1>
        <p className="mt-3 text-sm text-teal-100/90">{uz ? 'O‘rganish · takrorlash · mashq · tekshirish' : 'Learn · review · practise · check'}</p>
      </div>
      {lesson.courseSlug.startsWith('ielts-preparation-') && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-stone-800">
        <strong className="block text-base text-[#15473d]">{uz ? 'IELTS uchun chuqur o‘rganish' : 'IELTS in-depth preparation'}</strong>
        <p>{uz ? 'Ushbu dars mustaqil IELTS mashqidir, rasmiy imtihon emas. Ingliz tilini asosdan o‘rganish uchun A1–C1 kursi va kundalik lug‘at bo‘limidan ham foydalaning.' : 'This is independent IELTS practice, not an official mock test or band assessment. For complete language foundations, also work through General English A1–C1 and the Everyday Essentials library.'}</p>
        <div className="mt-2 flex flex-wrap gap-4 font-semibold text-teal-800"><Link to="/courses" className="underline underline-offset-4">{uz ? 'Barcha kurslar' : 'General English courses'}</Link><Link to="/essentials" className="underline underline-offset-4">{uz ? 'Kundalik so‘zlar' : 'Daily vocabulary'}</Link><a href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{uz ? 'Rasmiy IELTS namunalar' : 'Official IELTS samples'}</a></div>
      </div>}
      {previous && <p className="mt-5 text-sm font-semibold text-teal-700">{uz ? 'Oldingi mashq natijasi' : 'Previous practice result'}: {previous} <span className="font-normal text-slate-500">({uz ? 'faqat shu qurilmada' : 'this device only'})</span></p>}
      <section className="card mt-6 border-[#e5e8dc]">
        <h2 className="text-xl font-semibold">{uz ? 'Dars maqsadlari' : 'Learning goals'}</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-7 text-slate-700">{lesson.objectives.map((v,i) => <li key={i}>{v}</li>)}</ul>
      </section>
      {lesson.blocks.map(block => {
        const c = block.content as Teaching;
        const heading = string(c[uz?'headingUz':'headingEn']);
        return <section key={block.id} className="card mt-6 border-[#e5e8dc]">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-100 text-sm font-bold text-teal-900">{block.position+1}</span><h2 className="text-xl font-semibold">{heading}</h2></div>
          {block.type === 'EXPLANATION' && <>
            <p className="leading-8 text-slate-700">{string(c[uz?'uz':'en'])}</p>
            <div className="mt-5 rounded-xl bg-teal-50 p-4 text-teal-950"><p className="mb-2 font-semibold">{uz?'Namunaviy gap':'Model sentence'}</p><p>{string(c.modelEn)}</p><p className="mt-2 text-sm opacity-80">{string(c.modelUz)}</p></div>
            {c.studyGuide && <div className="mt-6 space-y-4" data-testid="ielts-depth-guide">
              <div className="rounded-2xl border border-[#c6dfd7] bg-white p-5">
                <h3 className="text-lg font-semibold text-[#14473b]">{uz ? 'Grammatika va til tuzilishi' : 'Grammar and language focus'}</h3>
                <p className="mt-2 leading-7 text-slate-800">{uz ? c.studyGuide.grammar.uz : c.studyGuide.grammar.en}</p>
              </div>
              <div className="rounded-2xl border border-[#e4d1ab] bg-[#fffaf0] p-5">
                <h3 className="text-lg font-semibold text-[#14473b]">{uz ? 'Mustaqil amaliy vazifa' : 'Independent skill challenge'}</h3>
                <p className="mt-2 leading-7 text-slate-800">{uz ? c.studyGuide.task.uz : c.studyGuide.task.en}</p>
                <details className="mt-3 rounded-xl border border-[#e8d8b8] bg-white p-3">
                  <summary className="cursor-pointer font-semibold">{uz ? 'Ishlangan namunani ochish' : 'Reveal a worked example'}</summary>
                  <p className="mt-3 leading-7 text-slate-700">{c.studyGuide.model.en}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{c.studyGuide.model.uz}</p>
                </details>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <h3 className="font-semibold text-rose-900">{uz ? 'Keng tarqalgan xato' : 'Common mistake to avoid'}</h3>
                <p className="mt-1 text-sm leading-7 text-rose-950">{uz ? c.studyGuide.pitfall.uz : c.studyGuide.pitfall.en}</p>
              </div>
            </div>}
          </>}
          {block.type === 'VOCABULARY' && <>
            <p className="mb-3 text-sm text-slate-600">{uz ? 'Ushbu darsdagi iboralar' : 'Topic expressions in this lesson'}: <strong className="text-teal-900">{(c.items ?? []).length}</strong>. {uz ? 'Tinglang, tarjima qiling va gap ichida ishlating.' : 'Listen, translate, then use each in your own sentence.'}</p>
            <div className="grid gap-2 sm:grid-cols-2">{(c.items ?? []).map((p,i) => <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><div><strong className="block text-sm text-ink">{p.en}</strong><span className="text-sm text-slate-600">{p.uz}</span></div><button type="button" aria-label={`Listen to ${p.en}`} onClick={() => speak(p.en)} className="shrink-0 rounded-lg p-2 text-teal-700 hover:bg-teal-100"><Volume2 size={18}/></button></div>)}</div>
            <p className="mt-4 text-xs text-slate-500">{uz?'So‘zlarni eshitish uchun karnayni bosing. Talaffuz brauzeringizga bog‘liq.':'Press the speaker for browser-generated English pronunciation.'}</p>
          </>}
          {block.type === 'READING' && <>
            {isListeningPractice && !showExamTranscript && <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-7">{uz?'Avval matnni ko‘rmasdan tinglab, asosiy fikr va muhim tafsilotlarni yozing. Bu brauzer ovozi, haqiqiy imtihon audiosi emas.':'First listen without seeing the text. Note the main point and key details. This is browser-generated speech, not real examination audio.'}</div>}
            {(!isListeningPractice || showExamTranscript) && <div className="whitespace-pre-line rounded-xl bg-slate-50 p-5 leading-8 text-slate-800">{string(c.en)}</div>}
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => speak(string(c.listenText) || string(c.en))}><Volume2 size={17}/>{uz?'Matnni tinglash':'Listen to the text'}</button>
            {isListeningPractice && <button type="button" className="btn-secondary" onClick={() => setShowExamTranscript(v => !v)}>{showExamTranscript?(uz?'Matnni yashirish':'Hide transcript'):(uz?'Matnni ko‘rsatish':'Reveal transcript')}</button>}</div>
            {(!isListeningPractice || showExamTranscript) && <><details className="mt-4 rounded-xl border border-slate-100 p-4"><summary className="cursor-pointer font-semibold">{uz?'O‘zbekcha ma’nosi':'Uzbek translation'}</summary><p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{string(c.uz)}</p></details>
            <h3 className="mt-6 font-semibold">{uz?'Foydali gaplar':'Useful sentences'} ({(c.examples ?? []).length})</h3>
            <div className="mt-3 divide-y divide-slate-100">{(c.examples ?? []).map((p,i) => <div className="flex items-start justify-between gap-3 py-3" key={i}><div><p className="font-medium">{p.en}</p><p className="mt-1 text-sm text-slate-500">{p.uz}</p></div><button type="button" onClick={() => speak(p.en)} aria-label={`Listen to example ${i+1}`} className="shrink-0 p-2 text-teal-700"><Volume2 size={17}/></button></div>)}</div></>}
          </>}
          {block.type === 'MICROPHONE' && <>
            <p className="leading-7 text-slate-700">{string(c[uz?'promptUz':'promptEn'])}</p>
            <button type="button" className="btn-secondary mt-4 inline-flex items-center gap-2" onClick={() => speak(string(c.sampleEn))}><Volume2 size={17}/>{uz?'Namuna javobni eshiting':'Listen to a sample answer'}</button>
            <details className="mt-4 rounded-xl border border-slate-100 p-4"><summary className="cursor-pointer font-semibold">{uz?'Namunaviy javob':'Sample answer'}</summary><p className="mt-3 whitespace-pre-line">{string(c.sampleEn)}</p><p className="mt-2 text-sm text-slate-500">{string(c.sampleUz)}</p></details>
            <SpeakingLab key={lesson.id} lessonId={lesson.id} prompts={[...(c.drills ?? []), ...((c.speakingExpansion?.repeat ?? []).filter(p => !(c.drills ?? []).some(d => d.en.trim().toLowerCase() === p.en.trim().toLowerCase())))]} />
            {c.speakingExpansion && <GuidedSpeaking key={`guided-${lesson.id}`} lessonId={lesson.id} expansion={c.speakingExpansion} />}
            <p className="mt-4 text-xs text-slate-500">{string(c[uz?'noteUz':'noteEn'])}</p>
          </>}
          {block.type === 'QUESTION' && <>
            <div className="space-y-6">{(c.questions ?? []).map((item,i) => <fieldset key={i} className="rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold">{i+1}. {uz?item.promptUz:item.promptEn}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{item.options.map((answer,j) => <label key={j} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${checked && j===item.answer?'border-teal-400 bg-teal-50':checked && answers[i]===j?'border-red-300 bg-red-50':'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name={`lesson-${lesson.id}-q-${i}`} checked={answers[i]===j} disabled={checked} onChange={() => setAnswers(prev=>({...prev,[i]:j}))}/>{answer}</label>)}</div>{checked && <p className="mt-3 text-sm text-teal-900">{uz?item.whyUz:item.whyEn}</p>}</fieldset>)}</div>
            <button type="button" className="btn mt-5" disabled={checked || Object.keys(answers).length!==questions.length} onClick={finish}>{uz?'Javoblarni tekshirish':'Check answers'}</button>
            {checked && <div className="mt-4 rounded-xl bg-teal-50 p-4 font-semibold text-teal-900">{uz?'Natija':'Score'}: {grade}/{questions.length}. {uz?'Bu faqat ushbu qurilmada saqlanadigan mashq natijasi.':'This practice result is saved only on this device.'}</div>}
            <div className="mt-8 border-t border-slate-100 pt-6"><h3 className="font-semibold">{uz?'Yozma mashq':'Writing practice'}</h3><p className="mt-2 text-sm leading-7">{string(c[uz?'writingPromptUz':'writingPromptEn'])}</p><textarea value={written} onChange={e=>setWritten(e.target.value)} className="mt-4 min-h-36 w-full rounded-xl border border-slate-200 p-4 text-sm outline-teal-600" placeholder={uz?'Javobingizni yozing...':'Write your response...'} aria-label={uz?'Yozma javob':'Written response'}/><p className="mt-2 text-xs text-slate-500">{uz ? 'So‘zlar soni' : 'Word count'}: {writtenCount} · {uz ? 'Matn faqat ushbu qurilmada saqlanadi.' : 'Draft saved on this device only.'}</p><button type="button" onClick={() => setShowModel(!showModel)} className="btn-secondary mt-3">{showModel?(uz?'Namunani yashirish':'Hide model'):(uz?'Namunaviy javobni ko‘rish':'See model answer')}</button>{showModel && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="whitespace-pre-line leading-7">{string(c.modelAnswerEn)}</p><p className="mt-3 whitespace-pre-line text-sm text-slate-600">{string(c.modelAnswerUz)}</p><p className="mt-3 text-xs text-slate-500">{string(c[uz?'tipUz':'tipEn'])}</p></div>}<p className="mt-3 text-xs text-slate-500">{uz?'Yozgan matningiz serverga yuborilmaydi yoki avtomatik baholanmaydi. Natijani namunaga va o‘quv rejasidagi mezonga solishtiring.':'Writing is not uploaded or automatically graded. Compare your draft with the model and the course-level checklist.'}</p></div>
          </>}
        </section>;
      })}
      {lessonExam && <LessonExam key={`exam-${lesson.id}`} lessonId={lesson.id} exam={lessonExam} />}
      {readOutMessage && <p role="status" className="mt-4 text-xs text-slate-500">{readOutMessage}</p>}
      <Link to={`/courses/${lesson.courseSlug}`} className="btn-secondary mt-8 inline-flex items-center gap-2"><CheckCircle2 size={17}/>{uz?'Boshqa darsni tanlash':'Explore other lessons'}</Link>
    </main>
  );
}
