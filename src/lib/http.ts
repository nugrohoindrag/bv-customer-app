// Klien HTTP BVRooms: Bearer access token customer (issuer bvrooms, dipersist untuk PWA/native), refresh single-flight
// (POST /bvrooms/auth/refresh {organization_slug, refresh_token}), error RFC 9457 problem+json, Idempotency-Key (UUID)
// untuk POST booking/payment. Base URL: VITE_API_BASE (absolut, wajib di native Capacitor) atau relatif (/api → proxy).
import { loadJSON, removeKey, saveJSON } from "./storage";

export const ORG_SLUG = import.meta.env.VITE_ORG_SLUG || "";
export const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
export const API_ROOT = API_BASE + "/api/v1/bvrooms";

export interface Problem {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  errors?: { field: string; message: string }[];
  request_id?: string;
}

export class ApiError extends Error {
  problem: Problem;
  constructor(p: Problem) {
    super(p.detail || p.title);
    this.problem = p;
  }
  get status() {
    return this.problem.status;
  }
  get code() {
    return this.problem.code;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function errorMessage(e: unknown, fallback = "Terjadi kesalahan. Coba lagi."): string {
  if (isApiError(e)) {
    if (e.problem.errors?.length) return e.problem.errors.map((x) => x.message).join(", ");
    return e.message || fallback;
  }
  if (e instanceof TypeError) return "Tidak dapat terhubung ke server. Periksa koneksi Anda.";
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export interface ListResponse<T> {
  data: T[];
  next_cursor: string | null;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_at?: string;
}

type Listener = (t: Tokens | null) => void;

class TokenStore {
  private tokens: Tokens | null = loadJSON<Tokens | null>("tokens", null);
  private listeners = new Set<Listener>();
  get() {
    return this.tokens;
  }
  set(t: Tokens | null) {
    this.tokens = t;
    if (t) saveJSON("tokens", t);
    else removeKey("tokens");
    this.listeners.forEach((l) => l(t));
  }
  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}
export const tokenStore = new TokenStore();

let refreshing: Promise<boolean> | null = null;
let sessionExpiredHandler: () => void = () => {};
export function setSessionExpiredHandler(fn: () => void) {
  sessionExpiredHandler = fn;
}

async function refreshToken(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const cur = tokenStore.get();
        if (!cur?.refresh_token) {
          tokenStore.set(null);
          sessionExpiredHandler();
          return false;
        }
        const res = await fetch(API_ROOT + "/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ organization_slug: ORG_SLUG, refresh_token: cur.refresh_token }),
        });
        if (!res.ok) {
          tokenStore.set(null);
          sessionExpiredHandler();
          return false;
        }
        const body = (await res.json()) as Tokens;
        tokenStore.set({ access_token: body.access_token, refresh_token: body.refresh_token || cur.refresh_token, expires_at: body.expires_at });
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

export type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Query;
  idempotencyKey?: string;
  signal?: AbortSignal;
  retry?: boolean;
  /** false = jangan kirim Authorization (endpoint publik); default true bila token ada */
  auth?: boolean;
  /** true = tambahkan organization_slug ke query (endpoint publik / katalog) */
  org?: boolean;
}

export function buildQuery(q?: Query): string {
  if (!q) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? "?" + s : "";
}

/** path relatif ke /api/v1/bvrooms (mis. "catalog/properties") atau absolut ("/api/v1/..."). */
export async function http<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const query: Query = { ...(opts.query ?? {}) };
  if (opts.org) query.organization_slug = ORG_SLUG;
  const url = (path.startsWith("/") ? API_BASE + path : API_ROOT + "/" + path) + buildQuery(query);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const tok = tokenStore.get();
  if (tok && opts.auth !== false) headers["Authorization"] = "Bearer " + tok.access_token;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  const res = await fetch(url, {
    method: opts.method || (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (res.status === 401 && opts.retry !== false && !url.includes("/auth/") && opts.auth !== false && tok) {
    if (await refreshToken()) return http<T>(path, { ...opts, retry: false });
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const p = (json as Problem) || { title: res.statusText, status: res.status, code: "HTTP_" + res.status };
    if (!p.status) p.status = res.status;
    if (!p.code) p.code = "HTTP_" + res.status;
    throw new ApiError(p);
  }
  return json as T;
}
