import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PlayRank Admin"',
      "Cache-Control": "no-store",
    },
  });
}

function safeDecodeBasicAuth(authHeader: string) {
  try {
    if (!authHeader.startsWith("Basic ")) {
      return null;
    }

    const base64Credentials = authHeader.replace("Basic ", "");
    const credentials = atob(base64Credentials);
    const separatorIndex = credentials.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: credentials.slice(0, separatorIndex),
      password: credentials.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
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
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return unauthorized();
  }

  const decoded = safeDecodeBasicAuth(authHeader);

  if (!decoded) {
    return unauthorized();
  }

  if (decoded.username !== username || decoded.password !== password) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};