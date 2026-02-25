import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    // 1. Refresh Supabase Session and handle auth-related redirects
    const supabaseResponse = await updateSession(request);

    // If updateSession triggered a redirect (e.g., blocked from /dashboard without auth)
    if (supabaseResponse.headers.get("Location") || supabaseResponse.status !== 200) {
        return supabaseResponse;
    }

    // 2. Do i18n routing
    const intlResponse = intlMiddleware(request);

    // Merge Supabase cookies into the final Next-Intl response
    const supabaseCookies = supabaseResponse.headers.getSetCookie();
    supabaseCookies.forEach((cookie) => {
        intlResponse.headers.append("Set-Cookie", cookie);
    });

    return intlResponse;
}

export const config = {
    // Match only internationalized pathnames
    matcher: [
        "/",
        "/(ru|en|kk)/:path*",
        "/((?!api|_next|_vercel|.*\\..*).*)"
    ],
};
