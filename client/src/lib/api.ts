import type {
  CreditBalanceResponse,
  CheckoutBody,
  CheckoutResponse,
  CreditTransactionResponse,
  SessionListItem,
  SessionDetailResponse,
  SessionRateBody,
  CompanionListItem,
  ChatStartBody,
  ChatStartResponse,
  ChatEndBody,
  ChatEndResponse,
  ChatHeartbeatBody,
  MeResponse,
  RequestLinkBody,
  RequestLinkResponse,
  ConvertBody,
  ConvertResponse,
} from "@shared/types";

const BASE = "/api/v1";

function getAuthHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────

export async function requestLink(body: RequestLinkBody): Promise<RequestLinkResponse> {
  const res = await fetch(`${BASE}/auth/request-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function convertAnonymous(body: ConvertBody): Promise<ConvertResponse> {
  const res = await fetch(`${BASE}/auth/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function getMe(token: string): Promise<MeResponse> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

// ─── Credits ──────────────────────────────────────────────────────

export async function getCreditBalance(token: string): Promise<CreditBalanceResponse> {
  const res = await fetch(`${BASE}/credits/balance`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function createCheckout(token: string, body: CheckoutBody): Promise<CheckoutResponse> {
  const res = await fetch(`${BASE}/credits/checkout`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function verifyCheckoutSession(token: string, sessionId: string): Promise<{ success: boolean; balanceMinutes: number }> {
  const res = await fetch(`${BASE}/credits/verify-session`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ sessionId }),
  });
  return handleResponse(res);
}

export async function getCreditTransactions(token: string): Promise<CreditTransactionResponse[]> {
  const res = await fetch(`${BASE}/credits/transactions`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

// ─── Chat ─────────────────────────────────────────────────────────

export async function chatStart(token: string | null, body: ChatStartBody): Promise<ChatStartResponse> {
  const res = await fetch(`${BASE}/chat/start`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function chatEnd(token: string | null, body: ChatEndBody): Promise<ChatEndResponse> {
  const res = await fetch(`${BASE}/chat/end`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function chatHeartbeat(token: string | null, body: ChatHeartbeatBody): Promise<{ minutesRemaining: number | null }> {
  const res = await fetch(`${BASE}/chat/heartbeat`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

// ─── Sessions ─────────────────────────────────────────────────────

export async function listSessions(token: string): Promise<SessionListItem[]> {
  const res = await fetch(`${BASE}/sessions`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function getSessionDetail(token: string, id: string): Promise<SessionDetailResponse> {
  const res = await fetch(`${BASE}/sessions/${id}`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse(res);
}

export async function rateSession(token: string, id: string, body: SessionRateBody): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/sessions/${id}/rate`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

// ─── Companions ───────────────────────────────────────────────────

export async function listCompanions(): Promise<CompanionListItem[]> {
  const res = await fetch(`${BASE}/companions`);
  return handleResponse(res);
}

export async function getCompanion(id: string): Promise<CompanionListItem> {
  const res = await fetch(`${BASE}/companions/${id}`);
  return handleResponse(res);
}
