import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  Headphones,
  MessageCircle,
  Globe2,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react';
import { request } from '../lib/api';
import { Badge, ErrorState, Loading } from '../components/ui';
import { CourseGuide } from '../components/course-guide';
import type { TrackSummary, CourseOutline } from '../../../shared/src/contracts';
const icons = [BookOpen, GraduationCap, Globe2, Headphones, MessageCircle];
export function useTracks() {
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['tracks', i18n.language],
    queryFn: () => request<TrackSummary[]>('/tracks?locale=' + i18n.language),
    staleTime: 60_000,
  });
}
export function TrackGrid() {
  const { t } = useTranslation();
  const q = useTracks();
  if (q.isPending) return <Loading />;
  if (q.isError)
    return (
      <>
        <ErrorState error={q.error} retry={() => void q.refetch()} />
        <p className="muted mt-3">{t('common.serverNotice')}</p>
      </>
    );
  if (!q.data.length) return <p className="card">{t('common.noCourses')}</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {q.data.map((track, i) => {
        const Icon = icons[i % icons.length]!;
        return (
          <Link
            key={track.id}
            to={'/courses/' + track.slug}
            className={`group premium-tile card flex min-h-[285px] flex-col transition-all ${i === 0 ? 'border-[#c8deca] bg-[#edf5ee]' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl ${i === 0 ? 'bg-[#185342] text-[#f2dab1]' : 'bg-[#eaf4ee] text-teal-700'}`}
              >
                <Icon size={24} />
              </span>
              <Badge published={track.status === 'PUBLISHED'} />
            </div>
            <h3 className="mb-2 mt-8 text-xl font-bold tracking-tight">{t('tracks.' + track.titleKey)}</h3>
            <p className="muted">{t('tracks.' + track.titleKey + 'Desc')}</p>
            <div className="mt-auto flex items-center justify-between border-t border-[#d9e5d9] pt-5 text-xs font-semibold text-teal-800">
              <span>
                {track.courses.reduce((n, c) => n + c.publishedLessons, 0)}{' '}
                {t('common.publishedLessons')}
              </span>
              <ArrowUpRight size={20} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
export function CatalogPage() {
  const { t, i18n } = useTranslation();
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <p className="eyebrow">{t('common.allTracks')}</p>
      <h1 className="font-editorial mb-4 mt-3 text-5xl font-semibold">{t('home.tracksTitle')}</h1>
      <p className="muted mb-10 max-w-xl">{i18n.language === 'en' ? 'Explore published bilingual lessons and practise at your own pace.' : 'O‘zbekcha izohli darslarni tanlang va o‘z sur’atingizda mashq qiling.'}</p>
      <TrackGrid />
    </section>
  );
}
export function CoursePage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const q = useTracks();
  const match = q.data?.find((track) => track.slug === slug);
  const course = q.data?.flatMap((track) => track.courses).find((c) => c.slug === slug);
  const outline = useQuery({
    queryKey: ['outline', slug, i18n.language],
    queryFn: () => request<CourseOutline>(`/courses/${slug}/outline?locale=${i18n.language}`),
    enabled: Boolean(course && course.status === 'PUBLISHED'),
    staleTime: 60_000,
  });
  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!match && !course) return <div className="p-12">{t('common.notFound')}</div>;
  const uz = i18n.language !== 'en';
  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <Link to="/courses" className="mb-8 inline-flex items-center gap-2 text-sm text-teal-700">
        <ArrowLeft size={16} />{t('common.back')}
      </Link>
      <h1 className="font-editorial mb-5 text-5xl font-semibold">{match ? t('tracks.' + match.titleKey) : course!.name}</h1>
      <p className="muted mb-8">{uz ? 'Nashr qilingan darsni tanlab, lug‘at, matn, gapirish va yozish mashqlarini boshlang.' : 'Choose a published lesson to study vocabulary, reading, speaking and writing.'}</p>
      {match ? (
        <div className="grid gap-5 md:grid-cols-2">
          {match.courses.map(c => <article key={c.id} className="card">
            <Badge published={c.status === 'PUBLISHED'} />
            <h2 className="mb-3 mt-5 text-xl font-semibold">{c.name}</h2>
            <p className="muted">{c.description}</p>
            <p className="mt-4 text-sm font-semibold text-teal-700">{c.publishedLessons} {t('common.publishedLessons')}</p>
            <Link to={`/courses/${c.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">{t('common.view')} <ArrowUpRight size={16}/></Link>
          </article>)}
        </div>
      ) : (
        <>
          <div className="card mb-6"><Badge published={course!.status === 'PUBLISHED'}/><p className="muted mt-4">{course!.description}</p><p className="mt-4 text-sm font-semibold text-teal-700">{course!.publishedLessons} {t('common.publishedLessons')}</p></div>
          <CourseGuide key={course!.slug} slug={course!.slug} />
          {outline.isPending && course!.status === 'PUBLISHED' && <Loading />}
          {outline.isError && <ErrorState error={outline.error} retry={() => void outline.refetch()} />}
          {outline.data?.modules.map((m,i) => <article key={m.id} className="card mb-4">
            <h2 className="text-lg font-semibold">{i+1}. {m.title}</h2>
            <ol className="mt-3 divide-y divide-slate-100">{m.lessons.map((lesson,j) => <li key={lesson.id}>
              <Link to={`/lessons/${lesson.id}`} className="group flex items-center justify-between gap-3 py-4 text-sm hover:text-teal-700">
                <span><span className="font-semibold">{j+1}. {lesson.title}</span><span className="mt-1 block text-xs text-slate-500">{lesson.estimatedMinutes} min · {uz?'O‘qish va mashq':'Read and practise'}</span></span><ArrowUpRight size={18} className="shrink-0 text-teal-700"/>
              </Link>
            </li>)}</ol>
          </article>)}
          {course!.status !== 'PUBLISHED' && <p className="muted">{t('common.soonNote')}</p>}
        </>
      )}
    </section>
  );
}
