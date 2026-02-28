/**
 * API Client
 *
 * 型安全な API アクセス関数群。
 * Clerk セッションは Cookie で自動送信される。
 */

import type {
  Cat,
  CreateCatInput,
  UpdateCatInput,
  ToiletLog,
  CreateLogInput,
} from "@nekolog/shared";

const API_BASE = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) throw body;
  return body as T;
}

// --- Cats ---

export async function fetchCats(): Promise<{ cats: Cat[] }> {
  const res = await fetch(`${API_BASE}/cats`);
  return handleResponse(res);
}

export async function fetchCat(id: string): Promise<{ cat: Cat }> {
  const res = await fetch(`${API_BASE}/cats/${id}`);
  return handleResponse(res);
}

export async function createCat(
  data: CreateCatInput
): Promise<{ cat: Cat }> {
  const res = await fetch(`${API_BASE}/cats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateCat(
  id: string,
  data: UpdateCatInput
): Promise<{ cat: Cat }> {
  const res = await fetch(`${API_BASE}/cats/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteCat(
  id: string,
  confirmed: boolean
): Promise<{ success: boolean }> {
  const res = await fetch(
    `${API_BASE}/cats/${id}?confirmed=${confirmed}`,
    { method: "DELETE" }
  );
  return handleResponse(res);
}

export async function uploadCatImage(
  catId: string,
  file: File
): Promise<{ cat: Cat }> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/cats/${catId}/image`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

// --- Logs ---

export async function createLog(
  data: CreateLogInput
): Promise<{ log: ToiletLog }> {
  const res = await fetch(`${API_BASE}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
