import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get all users from auth.users
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      )
    }

    // Create profiles for each user
    const results = await Promise.all(
      users.users.map(async (user) => {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (existingProfile) {
          return { status: "skipped", user: user.id }
        }

        const { error } = await supabase.from("profiles").insert([
          {
            id: user.id,
            email: user.email,
            display_name: user.user_metadata.display_name || user.email,
          },
        ])

        if (error) {
          console.error(`Error creating profile for user ${user.id}:`, error)
          return { status: "error", user: user.id, error }
        }

        return { status: "created", user: user.id }
      })
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
