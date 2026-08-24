import type { NextApiRequest } from "next";
import { createHash, timingSafeEqual } from "crypto";
import { apiConfig } from "./config";
import { getDatabase, hashApiKey } from "./database";
import { UpscaleApiError } from "./errors";
import type { ApiPrincipal } from "./types";
import { introspectBananaApiKey } from "./banana-client";

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getClientIp = (req: NextApiRequest) =>
  firstHeader(req.headers["x-real-ip"]) ||
  firstHeader(req.headers["x-forwarded-for"])?.split(",")[0].trim() ||
  req.socket.remoteAddress ||
  "unknown";

const constantTimeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const isSameOriginWebRequest = (req: NextApiRequest) => {
  const host = firstHeader(req.headers.host)?.toLowerCase();
  if (!host) return false;
  const origin = firstHeader(req.headers.origin);
  const referer = firstHeader(req.headers.referer);
  const candidate = origin || referer;
  if (!candidate) return false;
  try {
    return new URL(candidate).host.toLowerCase() === host;
  } catch {
    return false;
  }
};

export const authenticateRequest = async (
  req: NextApiRequest,
  requiredScope: "read" | "write" | "admin" = "read",
): Promise<ApiPrincipal> => {
  const rawKey = firstHeader(req.headers["x-api-key"]);
  const database = getDatabase();

  if (rawKey) {
    if (rawKey.startsWith("bbmcp_")) {
      const principal = await introspectBananaApiKey(rawKey);
      if (!principal) {
        throw new UpscaleApiError(401, "UNAUTHORIZED", "Invalid API key.");
      }
      if (
        !principal.scopes.has(requiredScope) &&
        !principal.scopes.has("admin")
      ) {
        throw new UpscaleApiError(
          403,
          "FORBIDDEN",
          `API key does not have the ${requiredScope} scope.`,
        );
      }
      return principal;
    }
    const hashed = hashApiKey(rawKey);
    const row = database
      .prepare(
        "SELECT id,key_hash,scopes,rate_limit_per_hour FROM api_keys WHERE active=1 AND key_hash=?",
      )
      .get(hashed) as
      | {
          id: string;
          key_hash: string;
          scopes: string;
          rate_limit_per_hour: number;
        }
      | undefined;
    if (!row || !constantTimeEqual(row.key_hash, hashed)) {
      throw new UpscaleApiError(401, "UNAUTHORIZED", "Invalid API key.");
    }
    const scopes = new Set(row.scopes.split(",").map((scope) => scope.trim()));
    if (!scopes.has(requiredScope) && !scopes.has("admin")) {
      throw new UpscaleApiError(
        403,
        "FORBIDDEN",
        `API key does not have the ${requiredScope} scope.`,
      );
    }
    database
      .prepare("UPDATE api_keys SET last_used_at=? WHERE id=?")
      .run(Date.now(), row.id);
    return {
      id: `key:${row.id}`,
      kind: "api_key",
      scopes,
      rateLimitPerHour: row.rate_limit_per_hour,
    };
  }

  if (apiConfig.allowAnonymousWeb && isSameOriginWebRequest(req)) {
    const anonymousId = createHash("sha256")
      .update(getClientIp(req))
      .digest("hex")
      .slice(0, 24);
    return {
      id: `web:${anonymousId}`,
      kind: "anonymous_web",
      scopes: new Set(["read", "write"]),
      rateLimitPerHour: apiConfig.anonymousRateLimitPerHour,
    };
  }

  throw new UpscaleApiError(
    401,
    "UNAUTHORIZED",
    "Provide a valid X-API-Key header.",
  );
};

export const enforceRateLimit = (
  principal: ApiPrincipal,
  category: "read" | "upload" | "create" | "delete",
) => {
  const database = getDatabase();
  const windowStart = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  const categoryLimit =
    category === "create"
      ? Math.min(50, principal.rateLimitPerHour)
      : category === "upload"
        ? Math.min(100, principal.rateLimitPerHour)
        : principal.rateLimitPerHour;
  database
    .prepare(
      `INSERT INTO rate_windows(principal_id,category,window_start,request_count)
       VALUES(?,?,?,1)
       ON CONFLICT(principal_id,category,window_start)
       DO UPDATE SET request_count=request_count+1`,
    )
    .run(principal.id, category, windowStart);
  const row = database
    .prepare(
      "SELECT request_count FROM rate_windows WHERE principal_id=? AND category=? AND window_start=?",
    )
    .get(principal.id, category, windowStart) as { request_count: number };
  if (row.request_count > categoryLimit) {
    throw new UpscaleApiError(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Rate limit exceeded. Try again after the current hourly window.",
      { limit: categoryLimit, resetAt: windowStart + 3_600_000 },
    );
  }
};
