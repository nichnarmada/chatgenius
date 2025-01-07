"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface JoinWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  workspace: {
    id: string
    name: string
  }
}

export function JoinWorkspaceModal({
  isOpen,
  onClose,
  workspace,
}: JoinWorkspaceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("Could not get user information")
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id)
        .single()

      if (existingMember) {
        toast({
          variant: "destructive",
          title: "Already a member",
          description: "You are already a member of this workspace.",
        })
        onClose()
        return
      }

      // Insert the user as a member of the workspace
      const { error: insertError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: "member",
        })

      if (insertError) {
        throw insertError
      }

      // Get the default channel for the workspace
      const { data: defaultChannel } = await supabase
        .from("channels")
        .select("id")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

      // Show success toast
      toast({
        title: "Success",
        description: "You have joined the workspace successfully!",
      })

      // Close the modal
      onClose()

      // Redirect to the workspace's default channel or workspace page
      if (defaultChannel) {
        router.push(`/workspaces/${workspace.id}/channels/${defaultChannel.id}`)
      } else {
        router.push(`/workspaces/${workspace.id}`)
      }
    } catch (error) {
      console.error("Error joining workspace:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join workspace. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Workspace</DialogTitle>
          <DialogDescription>
            Do you want to join {workspace.name}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
