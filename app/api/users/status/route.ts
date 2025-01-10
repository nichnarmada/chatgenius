import { createClient } from "@/utils/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { UserStatusType } from "@/types/user-status"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: statuses, error } = await supabase
    .from("user_status")
    .select("*, profiles:user_id(*)")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(statuses)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { status } = await request.json()

  // Validate status
  if (status && !["online", "offline", "away", "busy"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Update both status and last_active_status if not going offline
  const statusUpdate =
    status === "offline" ? { status } : { status, last_active_status: status }

  // Update status and ensure session is active
  const [{ data, error }, sessionResult] = await Promise.all([
    supabase
      .from("user_status")
      .upsert(
        {
          user_id: user.id,
          ...statusUpdate,
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single(),
    supabase.from("user_sessions").upsert(
      {
        user_id: user.id,
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    ),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
