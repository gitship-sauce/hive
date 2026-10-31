import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/sessions";

// A quick first check: no cookie at all means not logged in. Pages and actions still check
// the session in the database, because a cookie can be expired or made up.
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Every page except log in, sign up, API routes, the WebSocket (it checks the session itself)
  // and files like favicon.ico.
  matcher: ["/((?!login|signup|api|ws$|_next/static|_next/image|.*\\.[a-z0-9]+$).*)"],
};
