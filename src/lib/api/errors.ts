/** Normalized API error thrown by the client wrapper. */
export class ApiError extends Error {
  status: number;
  /** Stable backend error code — switch on this, not the message. */
  code?: string;
  /** error.details from the envelope (e.g. { nextStep, retryable } or array). */
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Screen/endpoint the backend suggests routing to next, if any. */
  get nextStep(): string | undefined {
    const d = this.details;
    if (d && typeof d === "object" && "nextStep" in d) {
      const v = (d as { nextStep?: unknown }).nextStep;
      return typeof v === "string" ? v : undefined;
    }
    return undefined;
  }
}
