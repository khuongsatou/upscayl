import { createHash, randomUUID } from "crypto";
import { apiConfig } from "./config";
import { UpscaleApiError } from "./errors";
import type { ApiPrincipal } from "./types";

type IntrospectionResponse = {
  active: boolean;
  principal?: {
    id: string;
    keyId: string;
    keyPrefix: string;
    kind: "banana_api_key";
    scopes: string[];
    rateLimitPerHour: number;
  };
};

type CacheEntry = {
  principal: ApiPrincipal | null;
  expiresAt: number;
};

const authCache = new Map<string, CacheEntry>();

const cacheKey = (apiKey: string) =>
  createHash("sha256").update(apiKey).digest("hex");

export const platformRequest = async <T>(
  route: string,
  init: RequestInit = {},
): Promise<T> => {
  if (!apiConfig.bananaPlatformServiceKey) {
    throw new UpscaleApiError(
      503,
      "BANANA_AUTH_UNAVAILABLE",
      "Banana platform authentication is not configured.",
    );
  }
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    apiConfig.bananaAuthTimeoutMs,
  );
  try {
    const response = await fetch(
      `${apiConfig.bananaPlatformApiBaseUrl}${route}`,
      {
        ...init,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Service-Key": apiConfig.bananaPlatformServiceKey,
          "X-Request-Id": randomUUID(),
          ...(init.headers || {}),
        },
      },
    );
    const payload = (await response.json().catch(() => ({}))) as T & {
      error?: { code?: string; message?: string; details?: unknown };
    };
    if (!response.ok) {
      throw new UpscaleApiError(
        response.status >= 500 ? 503 : response.status,
        response.status >= 500
          ? "BANANA_AUTH_UNAVAILABLE"
          : payload.error?.code || "BANANA_PLATFORM_REJECTED",
        response.status >= 500
          ? "Banana platform authentication is temporarily unavailable."
          : payload.error?.message || "Banana platform rejected the request.",
        payload.error?.details,
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof UpscaleApiError) throw error;
    throw new UpscaleApiError(
      503,
      "BANANA_AUTH_UNAVAILABLE",
      "Banana platform authentication is temporarily unavailable.",
    );
  } finally {
    clearTimeout(timeout);
  }
};

export const introspectBananaApiKey = async (
  apiKey: string,
): Promise<ApiPrincipal | null> => {
  const hashed = cacheKey(apiKey);
  const cached = authCache.get(hashed);
  if (cached && cached.expiresAt > Date.now()) return cached.principal;

  const result = await platformRequest<IntrospectionResponse>(
    "/keys/introspect",
    { method: "POST", body: JSON.stringify({ apiKey }) },
  );
  const principal =
    result.active && result.principal
      ? {
          id: result.principal.id,
          kind: "banana_api_key" as const,
          scopes: new Set(result.principal.scopes),
          rateLimitPerHour: Math.max(
            1,
            Number(result.principal.rateLimitPerHour) || 1000,
          ),
          keyId: result.principal.keyId,
          keyPrefix: result.principal.keyPrefix,
        }
      : null;
  authCache.set(hashed, {
    principal,
    expiresAt:
      Date.now() +
      (principal
        ? apiConfig.bananaAuthCacheTtlMs
        : apiConfig.bananaAuthNegativeCacheTtlMs),
  });
  return principal;
};

export const clearBananaAuthCache = () => authCache.clear();

export type BananaQuotaReservation = {
  id: string;
  principalId: string;
  status: "active" | "completed" | "released" | "expired";
  units: number;
  expiresAt: string;
};

export const reserveBananaQuota = async ({
  principalId,
  idempotencyKey,
  units,
  metadata,
}: {
  principalId: string;
  idempotencyKey: string;
  units: number;
  metadata?: Record<string, unknown>;
}) =>
  platformRequest<{ reservation: BananaQuotaReservation; replayed: boolean }>(
    "/quota/reservations",
    {
      method: "POST",
      body: JSON.stringify({
        principalId,
        idempotencyKey,
        operation: "upscale",
        units,
        metadata,
      }),
    },
  );

export const completeBananaQuota = async (
  reservationId: string,
  metadata: Record<string, unknown> = {},
) =>
  platformRequest(`/quota/reservations/${encodeURIComponent(reservationId)}/complete`, {
    method: "POST",
    body: JSON.stringify({ metadata }),
  });

export const releaseBananaQuota = async (
  reservationId: string,
  metadata: Record<string, unknown> = {},
) =>
  platformRequest(`/quota/reservations/${encodeURIComponent(reservationId)}/release`, {
    method: "POST",
    body: JSON.stringify({ metadata }),
  });

export const sendBananaEvents = async (
  events: Array<Record<string, unknown>>,
) =>
  platformRequest<{ accepted: string[]; duplicates: string[] }>(
    "/events/batch",
    { method: "POST", body: JSON.stringify({ events }) },
  );
