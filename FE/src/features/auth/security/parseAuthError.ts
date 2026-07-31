import type { AuthApiErrorBody, AuthSecurityAlert } from "@/features/auth/security/types";
import { AUTH_SECURITY_ERROR_CODES } from "@/features/auth/security/constants";

const DEFAULT_LOGIN_ERROR =
  "Invalid credentials or server unavailable. Please try again.";

/** Do not expose file paths, API URLs, or stack traces to users. */
const TECHNICAL_MESSAGE_PATTERN =
  /(?:[A-Za-z]:\\|\/(?:src|api|features|node_modules|@)\/|\.tsx\b|\.jsx\b|\.ts\b|\.js\b|Cannot\s+(?:GET|POST|PUT|DELETE|PATCH)\s+|ECONNREFUSED|ERR_|\/api\/|https?:\/\/|Invalid login response from server)/i;

function getErrorBody(error: unknown): AuthApiErrorBody | null {
  const data = (error as { response?: { data?: AuthApiErrorBody } })?.response
    ?.data;
  return data ?? null;
}

function getRawErrorMessage(error: unknown): string | undefined {
  const body = getErrorBody(error);
  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  const fallback = (error as { message?: string })?.message?.trim();
  return fallback || undefined;
}

function toUserFacingMessage(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  if (raw.length > 200 || TECHNICAL_MESSAGE_PATTERN.test(raw)) {
    return undefined;
  }

  if (/^\/[\w./-]+$/.test(raw)) {
    return undefined;
  }

  if (/^Request failed with status code (\d+)$/.test(raw)) {
    const status = Number(raw.match(/\d+/)?.[0]);
    if (status === 401 || status === 403) {
      return "Invalid email or password.";
    }
    if (status >= 500) {
      return "Server error. Please try again later.";
    }
    return undefined;
  }

  if (raw === "Network Error") {
    return "Unable to reach the server. Check your connection and try again.";
  }

  return raw;
}

/** Map backend errors to user-facing login messages (lockout, 2FA, etc.). */
export function parseAuthSecurityError(error: unknown): AuthSecurityAlert {
  const body = getErrorBody(error);
  const code = body?.code;
  const message = toUserFacingMessage(getRawErrorMessage(error));

  if (code === AUTH_SECURITY_ERROR_CODES.ACCOUNT_LOCKED) {
    const retry = body?.retryAfterSeconds;
    return {
      variant: "destructive",
      title: "Account temporarily locked",
      description:
        retry && retry > 0
          ? `Too many failed attempts. Try again in ${Math.ceil(retry / 60)} minutes or contact your administrator.`
          : "Too many failed login attempts. Contact your administrator.",
    };
  }

  if (code === AUTH_SECURITY_ERROR_CODES.TWO_FACTOR_REQUIRED) {
    return {
      variant: "warning",
      title: "Two-factor authentication required",
      description: "Enter the verification code sent to your registered device.",
    };
  }

  if (code === AUTH_SECURITY_ERROR_CODES.ACCOUNT_INACTIVE) {
    return {
      variant: "destructive",
      title: "Account inactive",
      description: message ?? "Your account has been deactivated.",
    };
  }

  return {
    variant: "destructive",
    title: "Login failed",
    description: message ?? DEFAULT_LOGIN_ERROR,
  };
}

export function isTwoFactorRequired(error: unknown): boolean {
  const body = getErrorBody(error);
  return body?.code === AUTH_SECURITY_ERROR_CODES.TWO_FACTOR_REQUIRED;
}

export function getTwoFactorChallengeToken(error: unknown): string | null {
  return getErrorBody(error)?.challengeToken ?? null;
}
