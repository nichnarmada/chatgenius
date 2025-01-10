import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated and making a request to the app
  if (user && !request.nextUrl.pathname.startsWith("/api")) {
    // Check if profile exists and is set up
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_profile_setup")
      .eq("id", user.id)
      .single()

    // If profile doesn't exist or is not set up, redirect to setup-profile
    // unless they're already on the setup-profile page
    if (
      (!profile || profile.is_profile_setup === false) &&
      !request.nextUrl.pathname.startsWith("/setup-profile") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/setup-profile"
      return NextResponse.redirect(url)
    }

    // Update session
    await supabase.from("user_sessions").upsert(
      { user_id: user.id },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    )
  }

  // DO NOT DELETE THESE LINES AND COMMENTS
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") && //login page, found in /app/(auth-pages)/login/page.tsx, DO NOT DELETE
    !request.nextUrl.pathname.startsWith("/sign-up") && //sign up page, found in /app/(auth-pages)/sign-up/page.tsx, DO NOT DELETE
    !request.nextUrl.pathname.startsWith("/forgot-password") && //forgot password page, found in /app/(auth-pages)/forgot-password/page.tsx, DO NOT DELETE
    !request.nextUrl.pathname.startsWith("/verify-email") && //verify email page, found in /app/(auth-pages)/verify-email/page.tsx, DO NOT DELETE
    !request.nextUrl.pathname.startsWith("/auth") //auth handling callback api routes, DO NOT DELETE
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
