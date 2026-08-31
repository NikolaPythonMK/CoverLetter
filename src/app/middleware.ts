// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only set guestId for page requests (this file no longer matches /api anyway)
  if (!req.cookies.get("guestId")) {
    res.cookies.set("guestId", nanoid(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // avoid issues on localhost http
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return res;
}

export const config = {
  // Apply to *pages*, exclude /api, Next internals, and static files
  matcher: ["/((?!api|_next|_vercel|favicon.ico|.*\\..*).*)"],
};
