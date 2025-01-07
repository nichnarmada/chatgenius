import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageIcon } from "lucide-react"

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
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert([
      {
        name,
        image_url,
        created_by_user_id: session.user.id,
        members: [session.user.id],
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  redirect(`/workspaces/${workspace.id}`)
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

        <form action={createWorkspace} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Workspace image</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SVG, PNG, JPG or GIF (MAX. 2MB)
                    </p>
                  </div>
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter workspace name"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => history.back()}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full">
              Create Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
