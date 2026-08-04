// The refresh token lives in an httpOnly cookie so JavaScript on the page can
// never read it — that is the whole point of splitting it from the access
// token, which the client does hold in memory.
import type { Response } from "express";
import { isProduction } from "../config";

export const REFRESH_COOKIE = "sltc_refresh";

// Frontend and API are separate Vercel projects, so the cookie is cross-site in
// production and must be SameSite=None; that in turn requires Secure.
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/api/auth",
};

export function setRefreshCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions, maxAge: maxAgeMs });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
}

/** Converts "7d" / "15m" / "3600" into milliseconds. */
export function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])?$/.exec(ttl.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2] ?? "s";
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 1000);
}
