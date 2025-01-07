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

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      // Insert the user as a member of the workspace
      const { error } = await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        role: "member",
      })

      if (error) throw error

      // Refresh the page to show updated workspace list
      router.refresh()
      onClose()
    } catch (error) {
      console.error("Error joining workspace:", error)
      alert("Failed to join workspace. Please try again.")
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
