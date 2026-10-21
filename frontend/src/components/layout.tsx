import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ErrorState, Loading } from './ui';
export function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  return (
    <select
      aria-label={t('common.language')}
      value={i18n.language}
      onChange={(e) => void i18n.changeLanguage(e.target.value)}
      className="min-h-11 rounded-full border border-[#e0e8df] bg-white/80 px-3 py-1 text-xs font-semibold text-[#204a40]"
    >
      <option value="uz-Latn">O‘zbekcha</option>
      <option value="en">English</option>
    </select>
  );
}
function Brand() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight">
      <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#184a3e] text-[#f7ddac] shadow-sm">
        <BookOpen size={21} />
      </span>
      <span className="text-xl font-extrabold tracking-[-.055em]">
        noldan<span className="text-[#5c9f83]">ravon</span>
        <span className="text-[#c59f65]">.</span>
      </span>
    </Link>
  );
}
export function RootLayout() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4"
      >
        {t('common.skip')}
      </a>
      <header className="premium-header sticky top-0 z-40">
        <div className="mx-auto flex min-h-[82px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <Brand />
          <nav aria-label={t('nav.menu')} className="hidden items-center gap-7 lg:flex">
            {[
              ['courses', 'courses'],
              ['essentials', 'essentials'],
              ['pricing', 'pricing'],
              ['how-it-works', 'how'],
            ].map(([url, key]) => (
              <NavLink
                key={url}
                to={'/' + url}
                className={({ isActive }) =>
                  `premium-navlink text-sm font-semibold ${isActive ? 'active text-teal-800' : 'text-slate-600'}`
                }
              >
                {t('nav.' + key)}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitch />
            <Link
              to={user ? '/app/dashboard' : '/login'}
              className="hidden text-sm font-semibold text-[#1a5043] sm:block"
            >
              {t(user ? 'nav.dashboard' : 'nav.login')}
            </Link>
            {!user && (
              <Link to="/register" className="btn hidden lg:inline-flex">
                {t('nav.register')}
                <ArrowUpRight size={16} />
              </Link>
            )}
            <button
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={t(open ? 'nav.close' : 'nav.menu')}
              className="rounded-lg p-3 lg:hidden"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" className="flex flex-col gap-1 border-t border-[#e5e7df] bg-[#faf9f5] p-4 lg:hidden">
            {[
              ['courses', 'courses'],
              ['essentials', 'essentials'],
              ['pricing', 'pricing'],
              ['how-it-works', 'how'],
              [user ? 'app/dashboard' : 'login', user ? 'dashboard' : 'login'],
              ['register', 'register'],
            ]
              .filter(([url]) => !user || url !== 'register')
              .map(([url, key]) => (
                <Link key={url} to={'/' + url} className="rounded-lg p-3 font-semibold hover:bg-teal-50">
                  {t('nav.' + key)}
                </Link>
              ))}
          </nav>
        )}
      </header>
      {Boolean((location.state as {logoutWarning?: boolean} | null)?.logoutWarning) &&
        <div role="alert" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-950">
          {i18n.language !== 'en'
            ? 'Brauzerdan chiqdingiz, ammo server sessiyasi bekor qilinganini tasdiqlab bo‘lmadi. Ma’lumotlar bazasi tiklangach boshqa sessiyalarni ham tekshiring.'
            : 'Signed out of this browser, but server-side session revocation could not be confirmed. Check other sessions after the database recovers.'}
        </div>}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="border-t border-[#1b493e] bg-[#0d302b] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[1fr_2fr] lg:px-8">
          <div>
            <Brand />
            <p className="mt-4 text-sm leading-7 text-white/65">{t('brandTag')}</p>
            <p className="mt-4 max-w-sm text-xs leading-6 text-white/50">{t('home.independent')}</p>
          </div>
          <div className="flex flex-wrap content-start gap-x-6 gap-y-4 md:justify-end">
            {[
              ['essentials', 'essentials'],
              ['about', 'about'],
              ['blog', 'blog'],
              ['faq', 'faq'],
              ['contact', 'contact'],
              ['privacy', 'privacy'],
              ['terms', 'terms'],
            ].map(([url, key]) => (
              <Link key={url} to={'/' + url} className="text-sm text-white/65 hover:text-[#f1d59e]">
                {t('nav.' + key)}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Noldan Ravon · {t('common.phase')}
        </div>
      </footer>
    </>
  );
}
export const studentNav = [
  ['dashboard', 'dashboard'],
  ['courses', 'courses'],
  ['results', 'results'],
  ['profile', 'profile'],
  ['settings', 'settings'],
];
export const adminNav = [
  ['', 'overview'],
  ['analytics', 'analytics'],
  ['courses', 'courses'],
  ['modules', 'modules'],
  ['lessons', 'lessons'],
  ['content-editor', 'editor'],
  ['question-bank', 'questions'],
  ['exams', 'exams'],
  ['media', 'media'],
  ['translations', 'translations'],
  ['students', 'students'],
  ['payments', 'payments'],
  ['plans', 'plans'],
  ['ai/usage', 'ai'],
  ['releases', 'releases'],
  ['roles', 'roles'],
  ['audit-log', 'audit'],
  ['settings', 'settings'],
];
export function RequireAuth({ admin = false }: { admin?: boolean }) {
  const auth = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (auth.isPending) return <Loading />;
  if (auth.isError)
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorState error={auth.error} retry={() => void auth.refetch()} />
      </div>
    );
  if (!auth.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !auth.user.permissions.includes('admin.access'))
    return (
      <div className="mx-auto max-w-xl py-20">
        <h1 className="text-2xl">{t('common.forbidden')}</h1>
        <Link className="btn mt-6" to="/app/dashboard">
          {t('common.return')}
        </Link>
      </div>
    );
  return <Outlet />;
}
export function Workspace({ admin = false }: { admin?: boolean }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const [error, setError] = useState<unknown>(null);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => setNavOpen(false), [location.pathname]);
  const prefix = admin ? '/admin' : '/app',
    nav = admin ? adminNav : studentNav;
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      const logoutState = await auth.logout();
      navigate('/', { replace: true, state: logoutState === 'browser-only' ? {logoutWarning:true} : null });
    } catch (err) {
      // A failed server revocation must not be presented as a secure sign-out.
      setError(err);
    } finally { setSigningOut(false); }
  }
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="border-b border-ink/10 bg-white p-4 lg:border-b-0 lg:border-r">
        <button
          className="flex min-h-12 w-full items-center justify-between font-semibold lg:hidden"
          aria-expanded={navOpen}
          aria-controls="workspace-nav"
          onClick={() => setNavOpen(!navOpen)}
        >
          {t(admin ? 'admin.title' : 'nav.dashboard')}
          <Menu size={20} />
        </button>
        <div id="workspace-nav" className={`${navOpen ? 'block' : 'hidden'} lg:block`}>
          <p className="eyebrow mb-5 mt-3 px-3">{t(admin ? 'admin.title' : 'nav.dashboard')}</p>
          <nav className="space-y-1">
            {nav.map(([url, key]) => (
              <NavLink
                key={key}
                end
                to={prefix + (url ? '/' + url : '')}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-semibold text-teal-700' : 'text-slate-600 hover:bg-paper'}`
                }
              >
                <ChevronRight size={14} />
                {t(`${admin ? 'admin' : 'student'}.${key}`)}
              </NavLink>
            ))}
          </nav>
          {!admin && auth.user?.permissions.includes('admin.access') && (
            <Link className="mt-4 flex gap-2 rounded-xl p-3 text-sm" to="/admin">
              <ShieldCheck size={18} />
              {t('admin.title')}
            </Link>
          )}
          {admin && (
            <Link className="mt-4 flex gap-2 p-3 text-sm" to="/app/dashboard">
              <LayoutDashboard size={18} />
              {t('nav.dashboard')}
            </Link>
          )}
          <button
            onClick={() => void handleSignOut()}
            type="button"
            disabled={signingOut}
            aria-busy={signingOut}
            className="mt-4 flex min-h-11 items-center gap-2 rounded-xl p-3 text-sm text-slate-600"
          >
            <LogOut size={17} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>
      <div className="min-w-0 px-5 py-8 md:px-9 md:py-10">
        {error !== null && <ErrorState error={error} />}
        <Outlet />
      </div>
    </div>
  );
}
