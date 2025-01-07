import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function WorkspacesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch workspaces with their default channels
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select(
      `
      *,
      channels!channels_workspace_id_fkey (
        id,
        name
      )
    `
    )
    .or(`created_by_user_id.eq.${user.id},members.cs.{${user.id}}`)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Your Workspaces</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {workspaces?.map((workspace) => {
            // Get the first channel (default channel) for the workspace
            const defaultChannel = workspace.channels?.[0]
            const href = defaultChannel
              ? `/workspaces/${workspace.id}/channels/${defaultChannel.id}`
              : `/workspaces/${workspace.id}`

            return (
              <Link
                key={workspace.id}
                href={href}
                className="group aspect-square rounded-xl bg-card flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative w-full h-3/4 mb-2 flex items-center justify-center">
                  {workspace.image_url ? (
                    <img
                      src={workspace.image_url}
                      alt={workspace.name}
                      className="rounded-lg object-cover w-full h-full group-hover:ring-2 group-hover:ring-primary transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-muted group-hover:ring-2 group-hover:ring-primary transition-all duration-300" />
                  )}
                </div>
                <span className="text-lg font-medium text-center">
                  {workspace.name}
                </span>
              </Link>
            )
          })}

          <Link
            href="/workspaces/new"
            className="group aspect-square rounded-xl bg-card flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg"
          >
            <div className="relative w-full h-3/4 mb-2 flex items-center justify-center">
              <Plus className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-all duration-300" />
            </div>
            <span className="text-lg font-medium text-center">
              New Workspace
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
