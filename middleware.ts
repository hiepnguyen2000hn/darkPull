import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Allowlist: Các routes hợp lệ (được phép)
  const allowedRoutes = [
    '/assets',
    '/orders',
  ];

  // ✅ Cho phép các routes bắt đầu bằng (prefix match)
  const allowedPrefixes = [
    '/TradingDashboard/',  // Tất cả trading pairs: /TradingDashboard/btc-usdc, /TradingDashboard/eth-usdc, etc.
    '/api/',               // API routes
    '/_next/',             // Next.js internal
    '/static/',            // Static files
    '/favicon.ico',        // Favicon
  ];

  // Check if route is allowed
  const isAllowed = allowedRoutes.includes(pathname) ||
                    allowedPrefixes.some(prefix => pathname.startsWith(prefix));

  // ✅ Nếu KHÔNG phải route hợp lệ → redirect về /TradingDashboard/btc-usdc
  if (!isAllowed) {
    return NextResponse.redirect(new URL('/TradingDashboard/btc-usdc', request.url));
  }

  // Cho phép các routes hợp lệ
  return NextResponse.next();
}

// ✅ Matcher: Áp dụng cho tất cả routes trừ static files và API
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};