import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PlayRank Admin"',
    },
  });
}

export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Admin protection is not configured", {
      status: 500,
    });
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  const base64Credentials = authHeader.replace("Basic ", "");
  const credentials = atob(base64Credentials);

  const separatorIndex = credentials.indexOf(":");

  if (separatorIndex === -1) {
    return unauthorized();
  }

  const inputUsername = credentials.slice(0, separatorIndex);
  const inputPassword = credentials.slice(separatorIndex + 1);

  if (inputUsername !== username || inputPassword !== password) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
