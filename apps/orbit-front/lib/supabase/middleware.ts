import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Route Protection Logic
    const isAuthRoute = request.nextUrl.pathname.includes("/auth/login");
    const isProtectedRoute = request.nextUrl.pathname.includes("/dashboard"); // we will protect all routes starting with /dashboard
    const defaultLocale = "ru";

    if (!user && isProtectedRoute) {
        // If not logged in and trying to access protected route -> redirect to login
        const url = request.nextUrl.clone();
        url.pathname = `/${defaultLocale}/auth/login`;
        return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
        // If logged in and trying to access login page -> redirect to dashboard
        const url = request.nextUrl.clone();
        url.pathname = `/${defaultLocale}/dashboard`;
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
