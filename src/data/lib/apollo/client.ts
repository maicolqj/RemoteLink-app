// ─── Globals disponibles en RN 0.74+ pero ausentes en los tipos TS base ─────
declare function atob(data: string): string;
declare class TextEncoder { encode(input?: string): Uint8Array; }
declare const crypto: { subtle: SubtleCrypto };

// ─── Apollo Client v4: habilita errorPolicy:'all' de forma type-safe ─────────
declare module '@apollo/client' {
  interface DeclareDefaultOptions {
    watchQuery: { errorPolicy: 'all' };
    query:      { errorPolicy: 'all' };
    mutate:     { errorPolicy: 'all' };
  }
}

import { Platform } from 'react-native';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
  HttpLink,
  InMemoryCache,
  Observable,
  split,
  type FetchResult,
} from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { print } from 'graphql';
import type { OperationDefinitionNode } from 'graphql';
import SecureStorageService from '../../../infraestructure/services/SecureStorageService';
import { tokenRefreshService } from '../../../infraestructure/services/TokenRefreshService';
import { getDeviceId } from '../../../infraestructure/services/DeviceIdService';
import { PATH_SERVER, PATH_SERVER_LOCAL_ANDROID, PATH_SERVER_LOCAL_IOS, STAGE } from '@env';
import persistedDocuments from '../../../gql/persisted-documents.json';

import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';

// ==================== CONFIGURACIÓN ====================

const API_BASE_URL = (
  STAGE === 'production'
    ? PATH_SERVER
    : Platform.OS === 'android'
      ? PATH_SERVER_LOCAL_ANDROID
      : PATH_SERVER_LOCAL_IOS
).trim().replace(/\/graphql\/?$/, '');

export const DEBUG_API_URL = `STAGE=${STAGE} → ${API_BASE_URL}`;

const WS_BASE_URL = API_BASE_URL
  .replace(/^https/, 'wss')
  .replace(/^http(?!s)/, 'ws');

// ==================== ESTADO DE REFRESH ====================

let refreshPromise: Promise<string | null> | null = null;
let onLogoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  onLogoutCallback = callback;
};

if (__DEV__) {
  loadDevMessages();
  loadErrorMessages();
}

// ==================== HELPERS ====================

const decodeToken = (token: string): { exp: number } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch { return null; }
};

const isTokenExpiringSoon = (token: string, expiresAt?: number, bufferSeconds = 60): boolean => {
  if (expiresAt) return expiresAt - Date.now() < bufferSeconds * 1000;
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp - Math.floor(Date.now() / 1000) < bufferSeconds;
};

const attemptTokenRefresh = async (): Promise<string | null> => {
  try {
    return await tokenRefreshService.refreshToken();
  } catch (error: unknown) {
    if (__DEV__) console.error('[Apollo] refresh error:', error instanceof Error ? error.message : error);
    return null;
  }
};

const handleForceLogout = async () => {
  await SecureStorageService.clearTokens();
  if (onLogoutCallback) {
    onLogoutCallback();
  } else {
    const { useAuthStore } = await import('../../../presentation/store/auth.store');
    useAuthStore.getState().logout();
  }
};

// ==================== PERSISTED QUERIES ====================

const opNameToHash: Record<string, string> = Object.entries(
  persistedDocuments as Record<string, string>,
).reduce((acc, [hash, query]) => {
  const match = query.match(/^\s*(query|mutation|subscription)\s+(\w+)/);
  if (match) acc[match[2]] = hash;
  return acc;
}, {} as Record<string, string>);

const generateHash = async (document: import('graphql').DocumentNode): Promise<string> => {
  const opDef = document.definitions.find(
    (def): def is OperationDefinitionNode => def.kind === 'OperationDefinition',
  );
  const opName = opDef?.name?.value;
  if (opName && opNameToHash[opName]) return opNameToHash[opName];
  const query  = print(document);
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(query));
  return Array.from(new Uint8Array(buffer)).map((b: number) => b.toString(16).padStart(2, '0')).join('');
};

const persistedQueryLink = createPersistedQueryLink({ generateHash });

// ==================== HTTP LINK ====================

export const httpLink = new HttpLink({
  uri: `${API_BASE_URL}/graphql`,
  fetch,
});

// ==================== AUTH LINK ====================

const authLink = setContext(async (_, { headers, ...context }) => {
  const deviceId = await getDeviceId();

  if (context.skipAuth) {
    return {
      headers: { ...headers, 'x-device-id': deviceId, 'Content-Type': 'application/json' },
    };
  }

  const tokens = await SecureStorageService.getTokens();

  if (!tokens?.accessToken) {
    const { useAuthStore } = await import('../../../presentation/store/auth.store');
    const storeToken = useAuthStore.getState().token;
    return {
      headers: {
        ...headers,
        authorization: storeToken ? `Bearer ${storeToken}` : '',
        'x-device-id': deviceId,
        'Content-Type': 'application/json',
      },
    };
  }

  if (!refreshPromise && isTokenExpiringSoon(tokens.accessToken, tokens.accessTokenExpiresAt)) {
    refreshPromise = attemptTokenRefresh().finally((): void => { refreshPromise = null; });
  }

  if (refreshPromise) {
    const newToken = await refreshPromise;
    return {
      headers: {
        ...headers,
        authorization: newToken ? `Bearer ${newToken}` : `Bearer ${tokens.accessToken}`,
        'x-device-id': deviceId,
        'Content-Type': 'application/json',
      },
    };
  }

  return {
    headers: {
      ...headers,
      authorization: `Bearer ${tokens.accessToken}`,
      'x-device-id': deviceId,
      'Content-Type': 'application/json',
    },
  };
});

// ==================== ERROR LINK ====================

export const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (CombinedGraphQLErrors.is(error)) {
    const hasAuthError = error.errors?.some(({ message, extensions }) => {
      const code = extensions?.code as string;
      return (
        code === 'UNAUTHENTICATED' ||
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('token expired') ||
        message.toLowerCase().includes('invalid token') ||
        message.toLowerCase().includes('jwt expired')
      );
    });

    if (hasAuthError && !operation.getContext().skipAuth) {
      return new Observable<FetchResult>(observer => {
        if (!refreshPromise) {
          refreshPromise = attemptTokenRefresh().finally((): void => { refreshPromise = null; });
        }
        refreshPromise
          .then((newToken: string | null) => {
            if (newToken) {
              operation.setContext(({ headers: h = {} }: { headers: Record<string, string> }) => ({
                headers: { ...h, authorization: `Bearer ${newToken}` },
              }));
              forward(operation).subscribe(observer);
            } else {
              handleForceLogout();
              observer.error(error);
            }
          })
          .catch((): void => { handleForceLogout(); observer.error(error); });
      });
    }

    if (__DEV__) error.errors?.forEach(({ message, locations, path }) =>
      console.log(`[GraphQL error]: ${message} — Location: ${JSON.stringify(locations)}, Path: ${path}`),
    );

  } else if (CombinedProtocolErrors.is(error)) {
    if (__DEV__) error.errors?.forEach(({ message, extensions }) =>
      console.log(`[Protocol error]: ${message} — Extensions: ${JSON.stringify(extensions)}`),
    );
  } else {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 401 && !operation.getContext().skipAuth) {
      handleForceLogout();
    } else if (__DEV__) {
      console.warn(`[Network error]: ${error}`);
    }
  }
});

// ==================== RETRY LINK ====================

const retryLink = new RetryLink({
  delay: { initial: 300, max: Infinity, jitter: true },
  attempts: {
    max: 3,
    retryIf: (error: { message?: string }) => !!error && !error.message,
  },
});

// ==================== WEBSOCKET LINK ====================

let wsErrorCount = 0;

const wsLink = new GraphQLWsLink(
  createClient({
    url: `${WS_BASE_URL}/graphql`,
    lazy: true,
    connectionParams: async () => {
      const tokens = await SecureStorageService.getTokens();
      if (!tokens?.accessToken) return {};

      let accessToken = tokens.accessToken;
      if (isTokenExpiringSoon(accessToken, tokens.accessTokenExpiresAt)) {
        if (!refreshPromise) {
          refreshPromise = attemptTokenRefresh().finally((): void => { refreshPromise = null; });
        }
        const refreshed = await refreshPromise;
        if (refreshed) accessToken = refreshed;
      }
      return { Authorization: `Bearer ${accessToken}` };
    },
    retryAttempts: 5,
    retryWait: async (retries: number) => {
      await new Promise<void>(resolve => setTimeout(resolve, Math.min(1000 * 2 ** retries, 30_000)));
    },
    shouldRetry: (errOrCloseEvent: unknown) => {
      if (errOrCloseEvent && typeof errOrCloseEvent === 'object' && 'code' in errOrCloseEvent) {
        const code = (errOrCloseEvent as { code: number }).code;
        if (code >= 4400 && code <= 4500) return false;
      }
      return true;
    },
    on: {
      error: (err: unknown) => {
        wsErrorCount++;
        if (wsErrorCount === 1 && __DEV__) {
          const code   = err && typeof err === 'object' && 'code'   in err ? (err as { code: unknown }).code   : undefined;
          const reason = err && typeof err === 'object' && 'reason' in err ? (err as { reason: unknown }).reason : undefined;
          console.warn('[WS] Connection error — code:', code, 'reason:', reason);
        }
      },
      connected: () => { wsErrorCount = 0; if (__DEV__) console.log('[WS] Connected'); },
      closed:    () => { if (__DEV__) console.log('[WS] Connection closed'); },
    },
  }),
);

// ==================== SPLIT LINK ====================

const httpChain = STAGE === 'production'
  ? ApolloLink.from([retryLink, persistedQueryLink, errorLink, authLink, httpLink])
  : ApolloLink.from([retryLink, errorLink, authLink, httpLink]);

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpChain,
);

// ==================== CLIENT ====================

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all', notifyOnNetworkStatusChange: true },
    query:      { fetchPolicy: 'network-only', errorPolicy: 'all' },
    mutate:     { errorPolicy: 'all' },
  },
});

export default apolloClient;
