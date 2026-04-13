import { authStorage } from "./storage";

const WEB_APP_URL = "http://localhost:3000";
const AI_BACKEND_URL = "http://localhost:8000";

async function getToken(): Promise<string | null> {
  const auth = await authStorage.getValue();
  return auth?.token ?? null;
}

export async function fetchExtensionToken(): Promise<boolean> {
  try {
    const res = await fetch(`${WEB_APP_URL}/api/extension/token`, { credentials: "include" });
    if (!res.ok) return false;
    const data = await res.json();
    await authStorage.setValue({ token: data.token, user: data.user });
    return true;
  } catch { return false; }
}

export async function reportApplication(application: {
  job_url: string; company_name?: string; job_title?: string; job_description?: string;
  status: string; failure_reason?: string;
  questions_answered?: Array<{ question: string; answer: string; type: string }>;
  source_url?: string; platform?: string;
}) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${WEB_APP_URL}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(application),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getScreeningAnswers(request: {
  job_title: string; company_name: string; job_description: string;
  questions: Array<{ field_id: string; label: string; field_type: string; options?: string[]; required?: boolean }>;
  user_profile: Record<string, unknown>;
}) {
  const res = await fetch(`${AI_BACKEND_URL}/screening/answer`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`AI backend error: ${res.status}`);
  return res.json();
}

export async function getFieldMappings(request: {
  fields: Array<{ field_id: string; label: string; field_type: string; options?: string[] }>;
  user_profile: Record<string, unknown>; user_name: string; user_email: string;
}) {
  const res = await fetch(`${AI_BACKEND_URL}/mapping/fields`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`AI backend error: ${res.status}`);
  return res.json();
}

export async function getUserProfile(): Promise<Record<string, unknown> | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch(`${WEB_APP_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return res.json();
}
