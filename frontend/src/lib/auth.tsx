import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request, setCsrf, ApiError } from './api';
import type { PublicUser } from '../../../shared/src/contracts';
export function useAuth() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await request<PublicUser>('/me');
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
    staleTime: 30_000,
  });
  return {
    ...query,
    user: query.data,
    complete: (user: PublicUser, csrfToken: string) => {
      client.clear();
      setCsrf(csrfToken);
      client.setQueryData(['me'], user);
    },
    logout: async (): Promise<'revoked' | 'browser-only'> => {
      let state: 'revoked' | 'browser-only' = 'revoked';
      try {
        await request('/auth/logout', { method: 'POST', body: '{}' });
      } catch (e) {
        // The server has already cleared its HTTP-only browser cookie when
        // returning LOGOUT_PARTIAL, but database revocation could not complete.
        if (!(e instanceof ApiError && e.code === 'LOGOUT_PARTIAL')) throw e;
        state = 'browser-only';
      }
      setCsrf(null);
      client.clear();
      client.setQueryData(['me'], null);
      return state;
    },
  };
}
