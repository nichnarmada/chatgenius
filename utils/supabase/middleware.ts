import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Get current user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get current pathname
    const pathname = request.nextUrl.pathname

    // Define auth pages
    const isAuthPage =
      pathname.startsWith("/login") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/forgot-password")

    // Redirect authenticated users away from auth pages
    if (isAuthPage && user) {
      return NextResponse.redirect(new URL("/workspaces", request.url))
    }

    // Protect routes under (protected)
    if (pathname.startsWith("/(protected)") && !user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Redirect authenticated users from root to workspaces
    if (pathname === "/" && user) {
      return NextResponse.redirect(new URL("/workspaces", request.url))
    }

    return response
  } catch (e) {
    // If Supabase client could not be created
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
