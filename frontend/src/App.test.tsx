// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import i18n from './locales/i18n';
import App from './App';
import { setCsrf } from './lib/api';
const tracks = ['general', 'ielts', 'multilevel', 'spoken', 'conversation'].map((key, i) => ({
  id: String(i),
  slug: key,
  titleKey: key,
  status: 'COMING_SOON',
  courses: [],
}));
const response = (data: unknown, status = 200) =>
  Promise.resolve(
    new Response(
      JSON.stringify(status >= 400 ? { error: { code: 'UNAUTHENTICATED' } } : { data }),
      { status, headers: { 'Content-Type': 'application/json' } },
    ),
  );
function mount(path = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}
beforeEach(async () => {
  await i18n.changeLanguage('uz-Latn');
  setCsrf(null);
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => (url.includes('/tracks') ? response(tracks) : response(null, 401))),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('renders all five upcoming tracks and switches Uzbek to English', async () => {
  mount();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Yangi imkoniyatlar');
  await waitFor(() => expect(screen.getAllByText('Tez kunda').length).toBeGreaterThanOrEqual(5));
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Interfeys tili' }), 'en');
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Your next chapter');
  expect(document.documentElement.lang).toBe('en');
  expect(localStorage.getItem('nr-language')).toBe('en');
});
it('redirects a signed-out learner to sign in', async () => {
  mount('/app/dashboard');
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Yana ko‘rishganimizdan',
    ),
  );
});
it('shows a truthful unavailable state instead of a purchase button', async () => {
  mount('/pricing');
  expect(screen.getByText(/Bu versiyada hech narsa sotilmaydi/)).toBeDefined();
  expect(screen.queryByRole('button', { name: /buy|sotib/i })).toBeNull();
});
it('connects the registration form to CSRF bootstrap and backend registration', async () => {
  let posted: Record<string, unknown> | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (url.endsWith('/auth/csrf')) return response({ csrfToken: 'test-csrf' });
      if (url.endsWith('/auth/register')) {
        posted = JSON.parse(String(options?.body));
        expect(new Headers(options?.headers).get('X-CSRF-Token')).toBe('test-csrf');
        return response({
          user: {
            id: '1',
            email: 'aziza@example.test',
            displayName: 'Aziza',
            locale: 'uz-Latn',
            permissions: ['learning.read'],
            emailVerified: false,
          },
          csrfToken: 'rotated',
        });
      }
      return response(null, 401);
    }),
  );
  mount('/register');
  await userEvent.type(screen.getByLabelText('Ismingiz'), 'Aziza');
  await userEvent.type(screen.getByLabelText('Elektron pochta'), 'aziza@example.test');
  await userEvent.type(screen.getByLabelText('Parol'), 'a-long-unique-passphrase');
  await userEvent.click(screen.getAllByRole('checkbox')[0]!);
  await userEvent.click(screen.getByRole('button', { name: 'Hisob yaratish' }));
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Aziza'),
  );
  expect(posted?.acceptTerms).toBe(true);
  expect(posted?.marketingOptIn).toBe(false);
  expect(posted?.locale).toBe('uz-Latn');
});
it('blocks a student from the admin workspace', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      response({
        id: '1',
        email: 'aziza@example.test',
        displayName: 'Aziza',
        locale: 'uz-Latn',
        permissions: ['learning.read'],
        emailVerified: false,
      }),
    ),
  );
  mount('/admin');
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('ruxsatingiz yo‘q'),
  );
});
it('signing out from the workspace returns to the homepage, not the login screen', async () => {
  const user = { id: '1', email: 'student@example.test', displayName: 'Aziza',
    locale: 'uz-Latn', permissions: ['learning.read'], emailVerified: false };
  setCsrf('valid-test-csrf');
  const sent = vi.fn((url: string, options?: RequestInit) => {
    if (url.endsWith('/me')) return response(user);
    if (url.endsWith('/auth/logout')) {
      expect(options?.method).toBe('POST');
      expect(new Headers(options?.headers).get('X-CSRF-Token')).toBe('valid-test-csrf');
      return Promise.resolve(new Response(null, {status:204}));
    }
    if (url.includes('/tracks')) return response(tracks);
    return response(null, 401);
  });
  vi.stubGlobal('fetch', sent);
  mount('/app/dashboard');
  const logout = await screen.findByRole('button', { name: i18n.t('nav.logout') });
  await userEvent.click(logout);
  await waitFor(() => expect(screen.getByRole('heading', {level:1}).textContent).toContain('Yangi imkoniyatlar'));
  expect(screen.queryByRole('heading', {name: /Yana ko‘rishganimizdan/i})).toBeNull();
  expect(sent).toHaveBeenCalled();
});
it('keeps authenticated UI and displays error if server-side logout fails', async () => {
  const user = { id: '1', email: 'student@example.test', displayName: 'Aziza',
    locale: 'uz-Latn', permissions: ['learning.read'], emailVerified: false };
  setCsrf('valid-test-csrf');
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/me') ? response(user)
    : url.endsWith('/auth/logout') ? response(null,500)
    : url.includes('/tracks') ? response(tracks) : response(null,401)));
  mount('/app/dashboard');
  await userEvent.click(await screen.findByRole('button', {name:i18n.t('nav.logout')}));
  await waitFor(() => expect(screen.getByText(i18n.t('student.hello', {name:'Aziza'}))).toBeDefined());
  expect(screen.queryByRole('heading', {name:/Yangi imkoniyatlar/i})).toBeNull();
});
it('shows an explicit warning after browser-only sign out when MongoDB revocation fails', async () => {
  const user = {id:'1',email:'student@example.test',displayName:'Aziza',locale:'uz-Latn',permissions:['learning.read'],emailVerified:false};
  setCsrf('valid-test-csrf');
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/me') ? response(user)
    : url.endsWith('/auth/logout') ? Promise.resolve(new Response(JSON.stringify({error:{code:'LOGOUT_PARTIAL'}}),{status:503,headers:{'Content-Type':'application/json'}}))
    : url.includes('/tracks') ? response(tracks) : response(null,401)));
  mount('/app/dashboard');
  await userEvent.click(await screen.findByRole('button',{name:i18n.t('nav.logout')}));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('server sessiyasi bekor qilinganini'));
  expect(screen.getByRole('heading',{level:1}).textContent).toContain('Yangi imkoniyatlar');
});
