import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isValidation = err instanceof ZodError;
  const parserStatus =
    typeof err?.status === 'number' && [400, 413, 415].includes(err.status) ? err.status : null;
  const status = err instanceof HttpError ? err.status : isValidation ? 422 : (parserStatus ?? 500);
  const code =
    err instanceof HttpError
      ? err.code
      : isValidation
        ? 'VALIDATION_ERROR'
        : parserStatus === 413
          ? 'PAYLOAD_TOO_LARGE'
          : parserStatus
            ? 'BAD_REQUEST'
            : 'INTERNAL_ERROR';
  // Never log request bodies, passwords, raw tokens, query strings or provider responses.
  if (status === 500)
    console.error(JSON.stringify({ level: 'error', requestId: res.locals.requestId, code }));
  res
    .status(status)
    .json({
      error: {
        code,
        requestId: res.locals.requestId,
        ...(isValidation
          ? { fields: err.issues.map((i) => ({ path: i.path.join('.'), code: i.code })) }
          : {}),
      },
    });
};
