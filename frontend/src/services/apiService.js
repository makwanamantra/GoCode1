// Unified API service connecting the Django REST backend.
//
// Base URL resolution order (first hit wins):
//   1. window.__API_BASE__          -> lets you patch a deployed build at runtime
//   2. import.meta.env.VITE_API_BASE-> the Vercel environment variable
//   3. /api on the current origin   -> works when a proxy/rewrite is configured
//   4. http://127.0.0.1:8000/api    -> local development
//
// IMPORTANT (production): on Vercel set
//   VITE_API_BASE = https://<your-render-service>.onrender.com/api
// Environment variables are baked in at BUILD time, so redeploy after adding it.

function resolveBase() {
  const runtime = typeof window !== 'undefined' && window.__API_BASE__;
  if (runtime) return String(runtime).replace(/\/$/, '');

  const envBase = import.meta.env && import.meta.env.VITE_API_BASE;
  if (envBase) return String(envBase).replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    // Production safety net for this deployment: if Vercel env vars are missing,
    // still route API calls to the Render backend instead of same-origin 404s.
    if (window.location.hostname.endsWith('.vercel.app')) {
      return 'https://gocode-r6aq.onrender.com/api';
    }

    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Deployed without an explicit API base: assume a same-origin /api rewrite.
      return `${window.location.origin}/api`;
    }
  }

  return 'http://127.0.0.1:8000/api';
}

export const API_BASE = resolveBase();
export const MEDIA_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, payload = null, network = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.network = network;
  }
}

function buildUrl(endpoint, params) {
  const clean = String(endpoint).replace(/^\//, '');
  const url = new URL(`${API_BASE}/${clean}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

/** Pulls the first human-readable message out of a DRF error payload. */
function extractMessage(payload, status) {
  if (!payload) return `Request failed (HTTP ${status}).`;
  if (typeof payload === 'string') return payload;
  if (payload.error) return payload.error;
  if (payload.detail) return payload.detail;
  const first = Object.entries(payload)[0];
  if (first) {
    const [field, value] = first;
    const text = Array.isArray(value) ? value[0] : value;
    return `${field}: ${text}`;
  }
  return `Request failed (HTTP ${status}).`;
}

/**
 * Strict request: resolves with parsed JSON, throws ApiError on any failure.
 * Auth (login / signup / logout) uses this so users see the real reason.
 */
export async function apiRequest(endpoint, options = {}) {
  const { params, body, headers, ...rest } = options;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

  let res;
  try {
    res = await fetch(buildUrl(endpoint, params), {
      ...rest,
      body,
      // No cookies/sessions are used, so CSRF and credentials stay out of the way.
      credentials: 'omit',
      headers: isForm
        ? { Accept: 'application/json', ...(headers || {}) }
        : { 'Content-Type': 'application/json', Accept: 'application/json', ...(headers || {}) },
    });
  } catch (err) {
    throw new ApiError(
      `Cannot reach the server at ${API_BASE}. If the API is on Render's free plan it may be waking up — wait ~30s and retry.`,
      { network: true }
    );
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(payload, res.status), { status: res.status, payload });
  }
  return payload;
}

/** Lenient request used by dashboards: returns null instead of throwing. */
export async function fetchFromAPI(endpoint, options = {}) {
  try {
    return await apiRequest(endpoint, options);
  } catch (err) {
    console.warn(`API call failed for ${endpoint}, falling back to local state.`, err);
    return null;
  }
}

export function apiGet(endpoint, params) {
  return fetchFromAPI(endpoint, { method: 'GET', params });
}

export function apiPost(endpoint, body) {
  return fetchFromAPI(endpoint, { method: 'POST', body: JSON.stringify(body || {}) });
}

export function apiPatch(endpoint, body) {
  return fetchFromAPI(endpoint, { method: 'PATCH', body: JSON.stringify(body || {}) });
}

/** Throwing POST — use for auth so the UI can show the server's message. */
export function apiPostStrict(endpoint, body) {
  return apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body || {}) });
}

/** Multipart upload (resumes). Never sets Content-Type so the browser adds the boundary. */
export async function apiUpload(endpoint, formData) {
  try {
    return await apiRequest(endpoint, { method: 'POST', body: formData });
  } catch (err) {
    console.warn(`Upload failed for ${endpoint}.`, err);
    return null;
  }
}

export async function apiDelete(endpoint) {
  return fetchFromAPI(endpoint, { method: 'DELETE' });
}

/** Quick connectivity probe used by the auth panel. */
export async function pingApi() {
  try {
    await apiRequest('site-settings/', { method: 'GET' });
    return true;
  } catch (err) {
    return !err.network;
  }
}

/** Normalises DRF list responses (paginated or plain arrays). */
export function asList(res) {
  if (!res) return null;
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.results)) return res.results;
  return null;
}
