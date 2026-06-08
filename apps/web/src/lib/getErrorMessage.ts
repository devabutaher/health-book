/**
 * Extracts a human-readable error message from a catch clause value.
 * Handles RTK Query FetchBaseQueryError, regular Error instances, and fallbacks.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err && typeof err === "object") {
    // RTK Query FetchBaseQueryError: { status, data: { message } }
    if ("data" in err) {
      const data = (err as { data: { message?: string } }).data;
      if (data?.message) return data.message;
    }
    // Regular Error
    if (err instanceof Error) return err.message;
    // Axios-style { message }
    if ("message" in err) {
      const msg = (err as { message: string }).message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  }
  return fallback;
}
