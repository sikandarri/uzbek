import { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { registerSchema, loginSchema, type PublicUser } from '../../../shared/src/contracts';
import { request } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ErrorState } from '../components/ui';
export default function AuthPage({ register = false }: { register?: boolean }) {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [validation, setValidation] = useState(false);
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      request<{ user: PublicUser; csrfToken: string }>(
        '/auth/' + (register ? 'register' : 'login'),
        { method: 'POST', body: JSON.stringify(body) },
      ),
    onSuccess: (data) => {
      auth.complete(data.user, data.csrfToken);
      void i18n.changeLanguage(data.user.locale);
      const from = location.state?.from;
      navigate(
        typeof from === 'string' && /^\/(app|admin)(\/|$)/.test(from) ? from : '/app/dashboard',
        { replace: true },
      );
    },
  });
  if (auth.user) return <Navigate to="/app/dashboard" replace />;
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const raw = register
      ? {
          email: f.get('email'),
          password: f.get('password'),
          displayName: f.get('name'),
          locale: i18n.language,
          acceptTerms: f.get('terms') === 'on',
          marketingOptIn: f.get('marketing') === 'on',
        }
      : { email: f.get('email'), password: f.get('password') };
    const result = (register ? registerSchema : loginSchema).safeParse(raw);
    setValidation(!result.success);
    if (result.success) mutation.mutate(result.data);
  }
  return (
    <section className="mx-auto grid max-w-5xl gap-10 px-5 py-12 md:grid-cols-2 md:py-20">
      <div className="py-6">
        <p className="eyebrow">Noldan Ravon</p>
        <h1 className="font-editorial mt-5 text-5xl font-semibold leading-tight">
          {t(register ? 'auth.join' : 'auth.welcome')}
        </h1>
        <p className="muted mt-5 text-base">
          {t(register ? 'auth.registerText' : 'auth.loginText')}
        </p>
        <div className="mt-8 rounded-2xl border border-teal-700/10 bg-teal-50 p-5 text-sm leading-6 text-teal-700">
          {t('auth.prelaunch')}
        </div>
      </div>
      <form onSubmit={submit} className="card premium-shadow space-y-5 border-[#e4e6dc]" noValidate={false}>
        {mutation.isError && <ErrorState error={mutation.error} />}
        <div id="validation" aria-live="polite">
          {validation && (
            <p role="alert" className="text-sm text-red-800">
              {t(register ? 'auth.validation' : 'auth.loginValidation')}
            </p>
          )}
        </div>
        {register && (
          <label className="block text-sm font-medium">
            {t('auth.name')}
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              className="mt-2 w-full"
            />
          </label>
        )}
        <label className="block text-sm font-medium">
          {t('auth.email')}
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            className="mt-2 w-full"
          />
        </label>
        <label className="block text-sm font-medium">
          {t('auth.password')}
          <input
            type="password"
            name="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            required
            minLength={register ? 12 : 1}
            maxLength={128}
            className="mt-2 w-full"
            aria-describedby={register ? 'password-help' : undefined}
          />
        </label>
        {register && (
          <>
            <p id="password-help" className="muted text-xs">
              {t('auth.passwordHelp')}
            </p>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                name="terms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 accent-teal-700"
              />
              <span>
                {t('auth.terms')}{' '}
                <Link className="underline" to="/terms">
                  {t('nav.terms')}
                </Link>{' '}
                ·{' '}
                <Link className="underline" to="/privacy">
                  {t('nav.privacy')}
                </Link>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input name="marketing" type="checkbox" className="mt-1 h-4 w-4 accent-teal-700" />
              {t('auth.marketing')}
            </label>
          </>
        )}
        <button type="submit" disabled={mutation.isPending} className="btn w-full">
          {t(
            mutation.isPending
              ? 'auth.working'
              : register
                ? 'auth.submitRegister'
                : 'auth.submitLogin',
          )}
        </button>
        <p className="text-center text-sm text-slate-600">
          {t(register ? 'auth.haveAccount' : 'auth.newAccount')}{' '}
          <Link className="font-semibold text-teal-700" to={register ? '/login' : '/register'}>
            {t(register ? 'nav.login' : 'nav.register')}
          </Link>
        </p>
      </form>
    </section>
  );
}
