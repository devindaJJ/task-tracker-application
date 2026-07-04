import { isAxiosError } from "axios";
import type { ApiError } from "../types";

/**
 * Our FastAPI backend always returns errors as { error: { code, message, details? } }
 * (see backend/app/core/exception_handlers.py). Validation errors additionally
 * include a `details` array of Pydantic error objects. This pulls out a single
 * user-facing string for either case.
 */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError<ApiError>(error)) {
    const data = error.response?.data;
    if (data?.error?.details && Array.isArray(data.error.details)) {
      const first = data.error.details[0] as { msg?: string; loc?: string[] };
      if (first?.msg) {
        const field = first.loc?.[first.loc.length - 1];
        return field ? `${field}: ${first.msg}` : first.msg;
      }
    }
    if (data?.error?.message) {
      return data.error.message;
    }
    if (error.message === "Network Error") {
      return "Could not reach the server. Is the backend running?";
    }
  }
  return "Something went wrong. Please try again.";
}
