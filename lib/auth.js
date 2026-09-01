import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_COOKIE_NAME = "eco_admin_token";

// Default session (no "remember me"): expires when the browser session ends
// (no maxAge set on cookie) but the JWT itself still expires after JWT_EXPIRES_IN
// as a safety net.
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
// "Remember me" session: persists across browser restarts.
const JWT_REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || "30d";

function toSeconds(duration) {
  // supports formats like "1d", "30d", "12h" (jsonwebtoken style)
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 60 * 60 * 24; // default 1 day
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

export function signAuthToken(payload, rememberMe) {
  const expiresIn = rememberMe ? JWT_REMEMBER_EXPIRES_IN : JWT_EXPIRES_IN;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Build the Set-Cookie header value for the auth session.
 * If rememberMe is true, the cookie persists (maxAge set) for JWT_REMEMBER_EXPIRES_IN.
 * If false, it's a browser session cookie (cleared when the browser closes),
 * while still being backed by a short-lived JWT.
 */
export function buildAuthCookie(token, rememberMe) {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  if (rememberMe) {
    base.maxAge = toSeconds(JWT_REMEMBER_EXPIRES_IN);
  }
  // else: no maxAge/expires => session cookie, browser deletes it on close

  return serialize(AUTH_COOKIE_NAME, token, base);
}

export function buildClearAuthCookie() {
  return serialize(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getTokenFromReq(req) {
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const parsed = parse(cookieHeader);
  return parsed[AUTH_COOKIE_NAME] || null;
}

export function getUserFromReq(req) {
  const token = getTokenFromReq(req);
  if (!token) return null;
  return verifyAuthToken(token);
}

/**
 * Wraps an API route handler and requires a valid session.
 * Attaches the decoded user payload to req.user.
 */
export function requireAuth(handler) {
  return async (req, res) => {
    const user = getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    req.user = user;
    return handler(req, res);
  };
}

export { AUTH_COOKIE_NAME };
