import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "eco_admin_token";

// Edge middleware can't use the `jsonwebtoken` package (Node APIs), so we
// use `jose` here which works in the Edge runtime.
async function isValidToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch (err) {
    return false;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtected = pathname.startsWith("/dashboard");

  const valid = token ? await isValidToken(token) : false;

  if (isProtected && !valid) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && valid) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
