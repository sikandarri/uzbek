import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FeaturePending } from '../components/ui';
export function InfoPage({ kind }: { kind: string }) {
  const { t } = useTranslation();
  if (kind === 'placement-test')
    return (
      <div className="mx-auto max-w-4xl px-5 py-16">
        <FeaturePending title={t('nav.placement')} description={t('pages.placementText')} />
      </div>
    );
  if (kind === 'faq')
    return (
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="mb-8 text-4xl font-semibold">{t('nav.faq')}</h1>
        {[1, 2, 3].map((n) => (
          <details key={n} className="card mb-3">
            <summary className="cursor-pointer font-semibold">{t('pages.faqQ' + n)}</summary>
            <p className="muted mt-4">{t('pages.faqA' + n)}</p>
          </details>
        ))}
      </section>
    );
  if (kind === 'how-it-works')
    return (
      <section className="mx-auto max-w-4xl px-5 py-16">
        <h1 className="text-4xl font-semibold">{t('home.stepsTitle')}</h1>
        <p className="muted mb-8 mt-5">{t('home.stepsText')}</p>
        {['understand', 'practice', 'grow'].map((k) => (
          <article className="card mb-4" key={k}>
            <h2 className="text-xl font-semibold">{t('home.' + k)}</h2>
            <p className="muted mt-3">{t('home.' + k + 'Text')}</p>
          </article>
        ))}
      </section>
    );
  const heading = ['pricing', 'privacy', 'terms'].includes(kind)
    ? 'pages.' + kind + 'Title'
    : 'nav.' + kind;
  return (
    <section className="mx-auto min-h-[50vh] max-w-4xl px-5 py-16">
      <h1 className="mb-6 text-4xl font-semibold">{t(heading)}</h1>
      <div className="card">
        <p className="leading-8 text-slate-600">{t('pages.' + kind + 'Text')}</p>
      </div>
      {kind === 'pricing' && (
        <Link className="btn mt-6" to="/courses">
          {t('nav.courses')}
        </Link>
      )}
    </section>
  );
}
export function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-xl px-5 py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="my-6 text-3xl font-semibold">{t('common.notFound')}</h1>
      <Link className="btn" to="/">
        {t('common.home')}
      </Link>
    </section>
  );
}
