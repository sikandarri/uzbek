import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, LoaderCircle, AlertCircle, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/api';
export function Loading() {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex min-h-48 items-center justify-center gap-3">
      <LoaderCircle className="animate-spin" size={22} />
      {t('common.loading')}
    </div>
  );
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useTranslation();
  const code = error instanceof ApiError ? error.code : 'UNKNOWN';
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
      <p className="flex items-start gap-2">
        <AlertCircle size={20} className="shrink-0" />
        {t(`errors.${code}`, { defaultValue: t('errors.UNKNOWN') })}
      </p>
      {retry && (
        <button className="btn-secondary mt-4" onClick={retry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
export function Badge({ published = false }: { published?: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${published ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-950'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-teal-700' : 'bg-amber-700'}`} />
      {t(published ? 'common.published' : 'common.comingSoon')}
    </span>
  );
}
export function FeaturePending({ title, description }: { title: string; description?: string }) {
  const { t } = useTranslation();
  return (
    <section>
      <Badge />
      <h1 className="mb-4 mt-5 text-3xl font-semibold">{title}</h1>
      <div className="card max-w-2xl">
        <Clock3 className="mb-5 text-teal-700" size={30} />
        <p className="mb-3 text-lg">{t('common.unavailable')}</p>
        <p className="muted">{description ?? t('common.noPurchase')}</p>
      </div>
    </section>
  );
}
export function EmptyCourses() {
  const { t } = useTranslation();
  return (
    <div className="card flex flex-col items-center py-14 text-center">
      <BookOpen size={38} className="mb-5 text-teal-700" />
      <h2 className="text-xl font-semibold">{t('student.emptyTitle')}</h2>
      <p className="muted mb-6 mt-3 max-w-md">{t('student.emptyText')}</p>
      <Link to="/courses" className="btn">
        {t('student.explore')}
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}
