// Typed client for the SLTC API.
//
// The access token is held in memory only — never localStorage, so an XSS bug
// cannot read it. Session continuity across a page reload comes from the
// httpOnly refresh cookie instead: `refresh()` mints a new access token from it.
//
// Any request that comes back 401 is retried exactly once behind a refresh, and
// concurrent 401s share a single refresh call rather than stampeding the API.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** In-flight refresh, shared so parallel 401s trigger only one round-trip. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const body = (await res.json()) as { accessToken?: string };
      if (!body.accessToken) return false;
      accessToken = body.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      // Cleared on the next tick so callers awaiting this promise all see it.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}

/** Exposed so the auth provider can restore a session on first paint. */
export const restoreSession = refreshAccessToken;

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

async function toApiError(res: Response): Promise<ApiError> {
  let code = "REQUEST_FAILED";
  let message = res.statusText || "The request failed.";
  let details: unknown;

  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string; details?: unknown } };
    if (body.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      details = body.error.details;
    }
  } catch {
    // Non-JSON error body — keep the status text.
  }

  return new ApiError(res.status, code, message, details);
}

async function request<T>(path: string, options: RequestOptions = {}, allowRetry = true): Promise<T> {
  const { method = "GET", body, signal } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    signal,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (res.status === 401 && allowRetry) {
    const recovered = await refreshAccessToken();
    if (recovered) return request<T>(path, options, false);
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export const api = {
  get: <T,>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T,>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T,>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ----------------------------------------------------------------- API types

export type Role = "admin" | "org" | "student";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string;
  studentId?: string;
};

export type LoginResponse = { accessToken: string; user: SessionUser };

export type Kpi = { label: string; value: string; delta: string; tone?: string };
export type TrendPoint = { month: string; period: string; revenue: number; collected: number };
export type OccupancySlice = { name: string; value: number };
export type Alert = { kind: string; detail: string; due: string; amount?: string };
export type AdminBusRow = {
  reg: string;
  type: string;
  org: string;
  route: string;
  driver: string;
  status: string;
};
export type AdminOrgRow = {
  _id: string;
  name: string;
  type: string;
  students: number;
  routes: number;
  status: string;
  dues: string;
};

export type AdminDashboard = {
  kpis: Kpi[];
  revenueTrend: TrendPoint[];
  occupancy: OccupancySlice[];
  alerts: Alert[];
  buses: AdminBusRow[];
  organizations: AdminOrgRow[];
};

export type OrgStudentRow = {
  _id: string;
  id: string;
  name: string;
  grade: string;
  route: string;
  pickup: string;
  status: string;
};

export type OrgDashboard = {
  organization: { _id: string; name: string; type: string };
  stats: { label: string; value: string; delta: string }[];
  revenueTrend: TrendPoint[];
  students: OrgStudentRow[];
};

export type StudentProfile = {
  id: string;
  _id: string;
  name: string;
  org: string | null;
  grade: string;
  ratePerKm: number;
  route: { code: string; name: string; distanceKm: number } | null;
  pickup: { point: string; time: string | null; drop: string | null };
  bus: { reg: string; type: string } | null;
  driver: { name: string; phone: string } | null;
  monthlyFee: number | null;
};

export type StudentInvoice = {
  id: string;
  _id: string;
  period: string;
  amount: number;
  status: string;
  date: string;
  receiptUrl: string | null;
};

export type ListEnvelope<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type RouteRevenue = { route: string; revenue: number };
