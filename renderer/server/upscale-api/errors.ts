import type { NextApiResponse } from "next";

export class UpscaleApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const sendApiError = (
  res: NextApiResponse,
  requestId: string,
  error: unknown,
) => {
  const normalized =
    error instanceof UpscaleApiError
      ? error
      : new UpscaleApiError(
          500,
          "INTERNAL_SERVER_ERROR",
          "An unexpected error occurred.",
        );
  res.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      requestId,
      ...(normalized.details === undefined
        ? {}
        : { details: normalized.details }),
    },
  });
};
