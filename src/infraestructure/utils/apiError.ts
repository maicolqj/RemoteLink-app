/**
 * Extracción centralizada de mensajes de error del backend.
 *
 * Problema que resuelve: NestJS/GraphQL colapsa muchos errores a un mensaje
 * genérico ("Internal server error" / "error de servidor") y deja el detalle
 * real (validaciones, credenciales inválidas, etc.) dentro de `extensions` o,
 * cuando el servidor responde con un status HTTP != 2xx, dentro del body de la
 * respuesta (`ServerError.result` / `ServerError.bodyText`). Apollo, además, con
 * `errorPolicy: 'all'` no lanza errores de GraphQL: los devuelve en `result.error`.
 *
 * Regla de oro: SIEMPRE preferir el mensaje real del backend. Los mensajes
 * derivados de `code`/status HTTP son solo último recurso cuando no hay detalle.
 *
 * `getApiErrorMessage` acepta cualquier forma de error de la capa de datos
 * (Error lanzado, arreglo de GraphQLFormattedError, CombinedGraphQLErrors,
 * ServerError/networkError) y devuelve el mensaje más específico para el usuario.
 */

export interface ParsedApiError {
  /** Mensaje listo para mostrar en pantalla. */
  message: string;
  /** Código de error de GraphQL/HTTP si está disponible (UNAUTHENTICATED, BAD_USER_INPUT…). */
  code?: string;
  /** HTTP status si proviene de un network/server error. */
  statusCode?: number;
}

const DEFAULT_MESSAGE = 'Ocurrió un error inesperado. Intenta de nuevo.';
const OFFLINE_MESSAGE = 'Sin conexión. Revisa tu internet e intenta de nuevo.';

/** Mensajes del backend que son genéricos y NO deben mostrarse tal cual. */
const GENERIC_MESSAGES = [
  'internal server error',
  'error de servidor',
  'error del servidor',
  'unexpected error',
  'something went wrong',
  'response not successful',
  'forbidden resource',
];

const isGeneric = (msg?: string): boolean => {
  if (!msg) return true;
  const m = msg.trim().toLowerCase();
  return m.length === 0 || GENERIC_MESSAGES.some(g => m === g || m.includes(g));
};

/** Normaliza string | string[] a un mensaje legible, descartando lo genérico. */
const normalizeMessage = (value: unknown): string | undefined => {
  if (Array.isArray(value) && value.length) {
    const joined = value.filter(Boolean).join('\n');
    return isGeneric(joined) ? undefined : joined;
  }
  if (typeof value === 'string' && !isGeneric(value)) return value;
  return undefined;
};

/** NestJS guarda el detalle en varias rutas según el filtro de excepciones. */
const extractFromExtensions = (extensions?: Record<string, any> | null): string | undefined => {
  if (!extensions) return undefined;
  // Rutas conocidas donde NestJS deja el mensaje real (string | string[]).
  const candidates: unknown[] = [
    extensions.originalError?.message,
    extensions.response?.message,
    extensions.exception?.response?.message,
    extensions.exception?.message,
    extensions.message,
  ];
  for (const c of candidates) {
    const m = normalizeMessage(c);
    if (m) return m;
  }
  return undefined;
};

/**
 * Códigos de "infraestructura" cuyo `message` del backend es técnico y NO debe
 * mostrarse al usuario. Indican que las queries de la app no están registradas en
 * el manifest de trusted-documents del backend (típico tras agregar queries sin
 * re-sincronizar el manifest en prod). Su mensaje amigable tiene prioridad sobre
 * el `message` crudo del backend.
 */
const INFRA_CODE_MESSAGES: Record<string, string> = {
  PERSISTED_QUERY_NOT_ALLOWED: 'La app necesita actualizarse. Actualízala desde la tienda e intenta de nuevo.',
  PERSISTED_QUERY_REQUIRED: 'La app necesita actualizarse. Actualízala desde la tienda e intenta de nuevo.',
};

const codeToMessage = (code?: string): string | undefined => {
  switch (code) {
    case 'UNAUTHENTICATED':
    case 'UNAUTHORIZED':
      return 'Tu sesión expiró. Inicia sesión nuevamente.';
    case 'FORBIDDEN':
      return 'No tienes permisos para realizar esta acción.';
    case 'BAD_USER_INPUT':
    case 'VALIDATION_ERROR':
    case 'INVALID_INPUT':
      return 'Los datos enviados no son válidos.';
    case 'PERSISTED_QUERY_NOT_FOUND':
    case 'PERSISTED_QUERY_NOT_SUPPORTED':
      return undefined; // Apollo lo reintenta con la query completa; no mostrar al usuario.
    default:
      return undefined;
  }
};

/** Normaliza un GraphQLFormattedError a su mensaje más útil. */
const parseGraphQLError = (err: any): ParsedApiError => {
  const code = err?.extensions?.code as string | undefined;

  // Códigos de infraestructura: su message es técnico → mensaje amigable manda.
  if (code && INFRA_CODE_MESSAGES[code]) {
    return { message: INFRA_CODE_MESSAGES[code], code };
  }

  // El backend manda el detalle real en el `message` de nivel superior
  // (su formatError aplana extensions a { code, statusCode, detail, timestamp }).
  const fromMsg = normalizeMessage(err?.message);
  if (fromMsg) return { message: fromMsg, code };

  // Compat con backends que sí anidan el detalle en extensions (NestJS por defecto).
  const fromExt = extractFromExtensions(err?.extensions);
  if (fromExt) return { message: fromExt, code };

  const fromCode = codeToMessage(code);
  if (fromCode) return { message: fromCode, code };

  return { message: err?.message?.trim() || DEFAULT_MESSAGE, code };
};

/**
 * Intenta sacar el mensaje real del body de un ServerError (status HTTP != 2xx).
 * El body suele ser `{ errors: [...] }` (GraphQL) o `{ message, error }` (REST/Nest).
 */
const extractFromServerResult = (ne: any): string | undefined => {
  const result = ne?.result;
  if (result && typeof result === 'object') {
    // Body GraphQL: { errors: [ { message, extensions } ] }
    if (Array.isArray(result.errors) && result.errors.length) {
      const g = parseGraphQLError(result.errors[0]);
      if (!isGeneric(g.message)) return g.message;
    }
    // Body REST/Nest: { message: string|string[], error?: string }
    const m = normalizeMessage(result.message) ?? normalizeMessage(result.error);
    if (m) return m;
  }
  // Algunos transportes dejan el body como texto plano.
  if (typeof ne?.bodyText === 'string' && ne.bodyText.length < 300) {
    const m = normalizeMessage(ne.bodyText);
    if (m) return m;
  }
  return undefined;
};

/** Detecta errores de red / offline (sin respuesta del servidor). */
const isNetworkLike = (error: any): boolean => {
  const msg = (error?.message ?? '').toLowerCase();
  return (
    error?.name === 'ServerParseError' ||
    error?.name === 'ServerError' ||
    typeof error?.statusCode === 'number' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('unable to resolve host')
  );
};

/** Vuelca el error crudo en consola (solo dev) para diagnosticar el origen real. */
const devLog = (error: any): void => {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  try {
    const snapshot = {
      name: error?.name,
      message: error?.message,
      statusCode: error?.statusCode ?? error?.networkError?.statusCode,
      code: error?.extensions?.code ?? error?.errors?.[0]?.extensions?.code,
      gqlErrors: (error?.errors ?? error?.graphQLErrors)?.map((g: any) => ({
        message: g?.message,
        code: g?.extensions?.code,
        extensions: g?.extensions,
      })),
      result: error?.result ?? error?.networkError?.result,
      bodyText: error?.bodyText ?? error?.networkError?.bodyText,
    };
    console.log('[apiError] raw error →', JSON.stringify(snapshot, null, 2));
  } catch {
    console.log('[apiError] raw error (no serializable) →', error);
  }
};

/**
 * Devuelve el mensaje más específico y legible para cualquier error de la capa
 * de datos. Pásale el `error` capturado o el `error`/arreglo `errors` de Apollo.
 */
export function parseApiError(error: unknown, fallback = DEFAULT_MESSAGE): ParsedApiError {
  if (error == null) return { message: fallback };
  if (typeof error === 'string') return { message: error || fallback };

  const e = error as any;
  devLog(e);

  // 1. Arreglo `errors` (compatibilidad con Apollo v3 / paso de arreglo directo).
  if (Array.isArray(e)) {
    if (!e.length) return { message: fallback };
    return parseGraphQLError(e[0]);
  }

  // 2. Errores de GraphQL (preferidos sobre el network error que los envuelve).
  if (Array.isArray(e?.errors) && e.errors.length) {
    return parseGraphQLError(e.errors[0]);
  }
  if (Array.isArray(e?.graphQLErrors) && e.graphQLErrors.length) {
    return parseGraphQLError(e.graphQLErrors[0]);
  }

  // 3. Network / ServerError: PRIMERO el detalle real del body, luego el status.
  const networkError = e?.networkError ?? (isNetworkLike(e) ? e : undefined);
  if (networkError) {
    const statusCode = networkError.statusCode as number | undefined;

    const fromBody = extractFromServerResult(networkError);
    if (fromBody) return { message: fromBody, statusCode };

    if (statusCode === 400) return { message: 'La solicitud no es válida. Revisa los datos e intenta de nuevo.', statusCode };
    if (statusCode === 401) return { message: 'Credenciales inválidas o sesión expirada.', statusCode };
    if (statusCode === 403) return { message: 'Acceso denegado por el servidor.', statusCode };
    if (statusCode === 404) return { message: 'Recurso no encontrado.', statusCode };
    if (statusCode === 429) return { message: 'Demasiados intentos. Espera un momento e intenta de nuevo.', statusCode };
    if (statusCode && statusCode >= 500) return { message: 'El servidor no está disponible. Intenta más tarde.', statusCode };
    return { message: OFFLINE_MESSAGE, statusCode };
  }

  // 4. Un solo GraphQLFormattedError con extensions/locations.
  if (e?.extensions || (typeof e?.message === 'string' && e?.locations)) {
    return parseGraphQLError(e);
  }

  // 5. Error genérico ya lanzado por nuestros servicios.
  if (typeof e?.message === 'string' && e.message.trim()) {
    return isGeneric(e.message) ? { message: fallback } : { message: e.message };
  }

  return { message: fallback };
}

/** Conveniencia: solo el string del mensaje. */
export function getApiErrorMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
  return parseApiError(error, fallback).message;
}
