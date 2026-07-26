import type { AuthApiErrorBody, AuthSecurityAlert } from "@/features/auth/security/types";
import { AUTH_SECURITY_ERROR_CODES } from "@/features/auth/security/constants";

function getErrorBody(error: unknown): AuthApiErrorBody | null {
  const data = (error as { response?: { data?: AuthApiErrorBody } })?.response
    ?.data;
  return data ?? null;
}

/** Map lỗi BE → message hiển thị trên login (khóa tài khoản, 2FA, …). */
export function parseAuthSecurityError(error: unknown): AuthSecurityAlert {
  const body = getErrorBody(error);
  const code = body?.code;
  const message = body?.message;

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
    description: message ?? "Invalid credentials or server unavailable.",
  };
}

export function isTwoFactorRequired(error: unknown): boolean {
  const body = getErrorBody(error);
  return body?.code === AUTH_SECURITY_ERROR_CODES.TWO_FACTOR_REQUIRED;
}

export function getTwoFactorChallengeToken(error: unknown): string | null {
  return getErrorBody(error)?.challengeToken ?? null;
}
