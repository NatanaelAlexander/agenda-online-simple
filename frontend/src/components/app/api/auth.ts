import { apiFetch, apiFetchDetalle } from "@/lib/api/client";
import type { AuthTokensResponse } from "@/lib/auth/types";

export interface AuthMe {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutRequest(refreshToken: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutAllRequest(): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(
    "/auth/logout-all",
    { method: "POST", body: JSON.stringify({}) },
    true,
  );
}

export async function forgotPasswordRequest(email: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchMe(): Promise<AuthMe> {
  return apiFetchDetalle<AuthMe>("/auth/me", {}, true);
}

export async function updateProfile(input: {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
}): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>(
    "/auth/update-profile",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}
