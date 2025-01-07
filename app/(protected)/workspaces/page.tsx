import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { WorkspaceGrid } from "@/components/workspace/workspace-grid"

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .or(
      `members.cs.{${session.user.id}},created_by_user_id.eq.${session.user.id}`
    )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Choose a Workspace
        </h1>

        <WorkspaceGrid workspaces={workspaces || []} />
      </div>
    </div>
  )
}
