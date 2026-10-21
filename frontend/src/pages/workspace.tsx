import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { request } from '../lib/api';
import { ErrorState, Loading } from '../components/ui';
import { TrackGrid } from './catalog';
import { LanguageSwitch } from '../components/layout';
import { profileSchema, type PublicUser } from '../../../shared/src/contracts';
export function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <>
      <p className="eyebrow">{t('nav.dashboard')}</p>
      <h1 className="font-editorial mb-3 mt-3 text-4xl font-semibold">
        {t('student.hello', { name: user?.displayName })}
      </h1>
      <p className="muted mb-8">{t('student.intro')}</p>
      <div className="premium-dark mb-6 flex flex-wrap items-center justify-between gap-5 rounded-[1.5rem] p-7 text-white">
        <div>
          <CheckCircle2 className="mb-3 text-amber-500" />
          <h2 className="text-xl font-semibold">{t('student.ready')}</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-teal-100">{t('student.readyText')}</p>
        </div>
        <Link to="/courses" className="btn-secondary">
          {t('student.explore')}
          <ArrowRight size={17} />
        </Link>
      </div>
      <MyCourses />
    </>
  );
}
export function Profile() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const cache = useQueryClient();
  const [invalid, setInvalid] = useState(false);
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      request<PublicUser>('/me/profile', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (u) => {
      cache.setQueryData(['me'], u);
      void i18n.changeLanguage(u.locale);
    },
  });
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = profileSchema.safeParse({ displayName: f.get('name'), locale: f.get('locale') });
    setInvalid(!parsed.success);
    if (parsed.success) mutation.mutate(parsed.data);
  }
  return (
    <>
      <h1 className="text-3xl font-semibold">{t('student.profile')}</h1>
      <p className="muted mb-8 mt-3">{t('student.profileText')}</p>
      <form className="card max-w-xl space-y-5" onSubmit={submit}>
        {mutation.isError && <ErrorState error={mutation.error} />}
        <div role="status">
          {mutation.isSuccess && <p className="text-sm text-teal-700">{t('common.saved')}</p>}
          {invalid && <p className="text-sm text-red-800">{t('errors.VALIDATION_ERROR')}</p>}
        </div>
        <label className="block text-sm font-medium">
          {t('auth.name')}
          <input
            name="name"
            defaultValue={user?.displayName}
            required
            minLength={2}
            maxLength={80}
            className="mt-2 w-full"
          />
        </label>
        <label className="block text-sm font-medium">
          {t('auth.email')}
          <input type="email" value={user?.email ?? ''} readOnly className="mt-2 w-full bg-paper" />
        </label>
        <p className="muted text-xs">{t('student.emailNote')}</p>
        <label className="block text-sm font-medium">
          {t('common.language')}
          <select name="locale" defaultValue={user?.locale} className="mt-2 w-full">
            <option value="uz-Latn">O‘zbekcha</option>
            <option value="en">English</option>
          </select>
        </label>
        <button className="btn" disabled={mutation.isPending}>
          {t(mutation.isPending ? 'auth.working' : 'common.save')}
        </button>
      </form>
    </>
  );
}
export function Settings() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold">{t('student.settings')}</h1>
      <div className="card mb-5">
        <h2 className="mb-4 text-xl font-semibold">{t('common.language')}</h2>
        <LanguageSwitch />
        <p className="muted my-3">{t('student.settingsText')}</p>
        <Link to="/app/profile" className="text-sm font-semibold text-teal-700">
          {t('student.profile')} →
        </Link>
      </div>
      <div className="card">
        <ShieldCheck className="mb-4 text-teal-700" />
        <h2 className="text-xl font-semibold">{t('student.session')}</h2>
        <p className="muted mt-3">{t('student.sessionText')}</p>
      </div>
    </>
  );
}
export function AdminOverview() {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => request<{ phase: number; features: Record<string, boolean> }>('/admin/overview'),
    retry: false,
  });
  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  return (
    <>
      <p className="eyebrow">{t('admin.verified')}</p>
      <h1 className="mb-4 mt-3 text-3xl font-semibold">{t('admin.intro')}</h1>
      <div className="card max-w-2xl">
        <ShieldCheck size={32} className="mb-5 text-teal-700" />
        <p className="muted">{t('admin.scope')}</p>
      </div>
    </>
  );
}

// Public learning content is accessible without enrollment. Never suggest payment
// or user-specific server progress when these features are not implemented.
export function MyCourses() {
  const { i18n } = useTranslation();
  const uz = i18n.language !== 'en';
  return <section>
    <h1 className="mb-3 text-2xl font-semibold">{uz ? 'Mening o‘quv kurslarim' : 'Explore learning courses'}</h1>
    <p className="muted mb-6">{uz ? 'Darslarni hozir o‘qing va mashq qiling. Kursdagi mashqlar barcha foydalanuvchilar uchun ochiq.' : 'Open the published lessons and practise. Course study is available to everyone.'}</p>
    <TrackGrid />
    <p className="muted mt-5 text-sm">{uz ? 'Mashq ballari faqat shu qurilmada saqlanadi.' : 'Practice scores are stored only on this device.'}</p>
  </section>;
}
export function PracticeResults() {
  const { i18n } = useTranslation();
  const uz = i18n.language !== 'en';
  type RecordEntry = {id: string; score: number; total: number; at?: string; kind: 'checkpoint'|'exam'};
  const [records, setRecords] = useState<RecordEntry[]>([]);
  // Local-only quiz and exam records. These cannot establish IELTS or CEFR grades.
  useEffect(() => {
    const found: RecordEntry[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('noldan-practice-')) {
          const value = JSON.parse(window.localStorage.getItem(key) || '{}') as {score?:number;total?:number;at?:string};
          if (typeof value.score === 'number' && typeof value.total === 'number' && value.total > 0)
            found.push({id:key.slice('noldan-practice-'.length), score:value.score,total:value.total,at:value.at,kind:'checkpoint'});
        }
        if (key.startsWith('noldan-exam-v1-')) {
          const attempts = JSON.parse(window.localStorage.getItem(key) || '[]') as Array<{score:number;total:number;date:string}>;
          const latest=Array.isArray(attempts)?attempts[0]:null;
          if (latest && Number.isFinite(latest.score) && Number.isFinite(latest.total) && latest.total>0)
            found.push({id:key.slice('noldan-exam-v1-'.length),score:latest.score,total:latest.total,at:latest.date,kind:'exam'});
        }
      }
    } catch { /* Storage is optional. */ }
    found.sort((a,b)=>Date.parse(b.at??'')-Date.parse(a.at??''));
    setRecords(found);
  }, []);
  return <section>
    <h1 className="text-2xl font-semibold">{uz ? 'Mashq natijalari' : 'Practice results'}</h1>
    <p className="muted my-4">{uz ? 'Qisqa mashqlar va yakuniy testlar natijalari faqat shu qurilmada saqlanadi. Bu rasmiy IELTS yoki CEFR ballari emas.' : 'Checkpoint and lesson-exam results stay in this browser. They are not official IELTS or CEFR grades.'}</p>
    {!records.length ? <p className="card">{uz ? 'Hozircha natijalar yo‘q. Darsdagi testni yakunlang.' : 'No scores yet. Complete a lesson checkpoint or end-of-lesson exam.'}</p> : null}
    <div className="space-y-3">{records.map(r => <Link key={`${r.kind}-${r.id}`} to={`/lessons/${r.id}`} className="card block hover:border-teal-500">
      <span className="font-semibold">{r.kind==='exam'?(uz?'Dars yakuniy testi':'End-of-lesson assessment'):(uz?'Dars qisqa testi':'Lesson checkpoint')}: {r.score}/{r.total}</span>
      {r.at && <span className="muted mt-2 block text-xs">{new Date(r.at).toLocaleDateString(uz ? 'uz-UZ' : 'en-US')}</span>}
    </Link>)}</div>
  </section>;
}
