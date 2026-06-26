type TokenPayload = {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  token?: string;
  result?: TokenPayload;
  data?: TokenPayload;
};

/** Normalize BE auth responses — prefers accessToken, falls back to legacy token field. */
export function extractTokenPair(source: TokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  const payload = source.result ?? source.data ?? source;

  const accessToken =
    payload.accessToken ??
    payload.access_token ??
    source.accessToken ??
    payload.token ??
    source.token ??
    "";

  const refreshToken =
    payload.refreshToken ??
    payload.refresh_token ??
    source.refreshToken ??
    "";

  return { accessToken, refreshToken };
}
