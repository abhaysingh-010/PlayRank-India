import { NextRequest, NextResponse } from "next/server";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PlayRank Admin"',
      "Cache-Control": "no-store",
    },
  });
}

function csrfRejected() {
  return new NextResponse("Cross-site request rejected", {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function rateLimited(retryAfterSeconds: number) {
  return new NextResponse("Too many admin requests", {
    status: 429,
    headers: {
      "Cache-Control": "no-store",
      "Retry-After": String(retryAfterSeconds),
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
      "X-RateLimit-Remaining": "0",
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

function hasValidSameOrigin(request: NextRequest) {
  const originHeader = request.headers.get("origin");

  if (!originHeader) {
    return false;
  }

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host");

  if (!host) {
    return false;
  }

  const protocol =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");

  try {
    return new URL(originHeader).origin === `${protocol}://${host}`;
  } catch {
    return false;
  }
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(request: NextRequest) {
  const now = Date.now();
  const key = `${getClientIp(request)}:${request.nextUrl.pathname}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;

    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt,
    };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - current.count,
    resetAt: current.resetAt,
  };
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

  const isUnsafeAdminApiRequest =
    pathname.startsWith("/api/admin") && UNSAFE_METHODS.has(req.method);

  if (isUnsafeAdminApiRequest && !hasValidSameOrigin(req)) {
    return csrfRejected();
  }

  if (isUnsafeAdminApiRequest) {
    const result = checkRateLimit(req);

    if (!result.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.resetAt - Date.now()) / 1000),
      );

      return rateLimited(retryAfterSeconds);
    }

    const response = NextResponse.next();

    response.headers.set(
      "X-RateLimit-Limit",
      String(RATE_LIMIT_MAX_REQUESTS),
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      String(result.remaining),
    );

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
