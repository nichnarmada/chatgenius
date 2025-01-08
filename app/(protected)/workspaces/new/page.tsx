import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { CreateWorkspaceForm } from "./create-workspace-form"

async function createWorkspace(formData: FormData) {
  "use server"

  const name = formData.get("name")?.toString()
  const imageFile = formData.get("image") as File

  if (!name) {
    throw new Error("Workspace name is required")
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  let image_url = null

  // Upload image if provided
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("workspace-images")
      .upload(fileName, imageFile)

    if (uploadError) {
      throw new Error("Error uploading image")
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("workspace-images").getPublicUrl(fileName)

    image_url = publicUrl
  }

  // Create workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert([
      {
        name,
        image_url,
        created_by_user_id: session.user.id,
      },
    ])
    .select()
    .single()

  if (workspaceError) {
    throw new Error(workspaceError.message)
  }

  // Add the creator as a workspace member with 'owner' role
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert([
      {
        workspace_id: workspace.id,
        user_id: session.user.id,
        role: "owner",
      },
    ])

  if (memberError) {
    throw new Error(memberError.message)
  }

  // Create a default "general" channel
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .insert([
      {
        name: "general",
        workspace_id: workspace.id,
        created_by_user_id: session.user.id,
      },
    ])
    .select()
    .single()

  if (channelError) {
    throw new Error(channelError.message)
  }

  // Redirect to the default channel
  redirect(`/workspaces/${workspace.id}/channels/${channel.id}`)
}

export default async function NewWorkspacePage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create a new workspace</h1>
          <p className="text-muted-foreground">
            A workspace is where you and your team can collaborate
          </p>
        </div>

        <CreateWorkspaceForm createWorkspace={createWorkspace} />
      </div>
    </div>
  )
}
