"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
}: CreateWorkspaceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get("name")?.toString()
      const imageFile = formData.get("image") as File

      if (!name) {
        throw new Error("Workspace name is required")
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      let image_url = null

      // Upload image if provided
      if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
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
            created_by_user_id: user.id,
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
            user_id: user.id,
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
            created_by_user_id: user.id,
          },
        ])
        .select()
        .single()

      if (channelError) {
        throw new Error(channelError.message)
      }

      toast({
        title: "Workspace created",
        description: "Your workspace has been created successfully.",
      })

      onClose()
      router.refresh()
      router.push(`/workspaces/${workspace.id}/channels/${channel.id}`)
    } catch (error) {
      console.error("Error creating workspace:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Workspace image</Label>
              <div className="flex w-full items-center justify-center">
                <label
                  htmlFor="image"
                  className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted/50"
                >
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <ImageIcon className="mb-4 h-8 w-8 text-muted-foreground" />
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Create Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
