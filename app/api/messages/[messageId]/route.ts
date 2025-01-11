import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const messageId = request.nextUrl.pathname.split("/")[3]

    const response = NextResponse.next({
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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: message, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        profile:user_id (
          id,
          email,
          display_name,
          avatar_url
        ),
        reactions (
          id,
          emoji,
          user_id
        )
      `
      )
      .eq("id", messageId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error in GET /api/messages/[messageId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
