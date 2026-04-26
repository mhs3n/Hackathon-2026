import type {
  AuthLoginResponse,
  InstitutionDashboardView,
  KpiHistoryResponse,
  StudentDashboardView,
  UcarDashboardView,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export const AUTH_STORAGE_KEY = "ucar-insight-auth";

type StoredAuth = {
  accessToken: string;
  user: AuthLoginResponse["user"];
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const baseHeaders: Record<string, string> = isFormData
    ? {}
    : { "Content-Type": "application/json" };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...baseHeaders,
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        detail = body.detail;
      }
    } catch {
      // keep generic message
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export function getStoredAuth(): StoredAuth | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setStoredAuth(payload: StoredAuth) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function loginByRole(role: AuthLoginResponse["user"]["role"]) {
  return request<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

function authHeaders(): Record<string, string> {
  const auth = getStoredAuth();
  if (!auth) {
    return {};
  }
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export async function fetchUcarDashboard(periodId?: string) {
  const qs = periodId ? `?period_id=${encodeURIComponent(periodId)}` : "";
  return request<UcarDashboardView>(`/dashboard/ucar${qs}`, {
    headers: authHeaders(),
  });
}

export async function fetchInstitutionDashboard(institutionId: string, periodId?: string) {
  const qs = periodId ? `?period_id=${encodeURIComponent(periodId)}` : "";
  return request<InstitutionDashboardView>(`/dashboard/institution/${institutionId}${qs}`, {
    headers: authHeaders(),
  });
}

export async function fetchStudentDashboard(studentProfileId: string) {
  return request<StudentDashboardView>(`/dashboard/student/${studentProfileId}`, {
    headers: authHeaders(),
  });
}

export async function fetchKpiHistory(institutionId: string, domain: string) {
  return request<KpiHistoryResponse>(`/history/${institutionId}/${domain}`, {
    headers: authHeaders(),
  });
}

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatResponse = { reply: string; quickActions: string[] };

export async function sendChat(message: string, history: ChatMessage[]) {
  return request<ChatResponse>("/chat", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message, history }),
  });
}

export async function fetchQuickActions() {
  return request<string[]>("/chat/quick-actions", {
    headers: authHeaders(),
  });
}

export type IngestionPreview = {
  institutionId: string;
  institutionName: string;
  sourceFile: string;
  fileType: string;
  rawKpis: Record<string, number | null>;
  mapped: { academic?: Record<string, number>; finance?: Record<string, number>; esg?: Record<string, number> };
  alerts: string[];
  warnings: string[];
};

export type IngestionCommitResponse = {
  institutionId: string;
  periodId: string;
  written: Record<string, string[]>;
  batchId: string;
  importedAt: string;
};

export type ReportingPeriod = {
  id: string;
  label: string;
  year: number;
  semester: string;
  startsOn: string;
  endsOn: string;
};

export type ImportBatch = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  userId: string | null;
  sourceFile: string;
  fileType: string;
  domainsWritten: Record<string, string[]>;
  importedAt: string;
};

export async function previewImport(institutionId: string, file: File): Promise<IngestionPreview> {
  const form = new FormData();
  form.append("institution_id", institutionId);
  form.append("file", file);
  return request<IngestionPreview>("/import/preview", {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
}

export async function commitImport(
  institutionId: string,
  periodId: string,
  mapped: IngestionPreview["mapped"],
  meta?: { rawKpis?: Record<string, number | null>; sourceFile?: string; fileType?: string },
): Promise<IngestionCommitResponse> {
  return request<IngestionCommitResponse>("/import/commit", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ institutionId, periodId, mapped, ...meta }),
  });
}

export async function fetchPeriods(): Promise<ReportingPeriod[]> {
  return request<ReportingPeriod[]>("/periods", { headers: authHeaders() });
}

export async function fetchImportHistory(institutionId?: string): Promise<ImportBatch[]> {
  const qs = institutionId ? `?institution_id=${encodeURIComponent(institutionId)}` : "";
  return request<ImportBatch[]>(`/import/history${qs}`, { headers: authHeaders() });
}
