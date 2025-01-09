"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { WorkspacePictureUpload } from "@/components/workspace-picture-upload"
import { createClient } from "@/utils/supabase/client"

interface WorkspaceSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  workspace: {
    id: string
    name: string
    image_url: string | null
  }
}

export function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspace,
}: WorkspaceSettingsModalProps) {
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSave = async () => {
    try {
      setIsLoading(true)

      const { error } = await supabase
        .from("workspaces")
        .update({ name: workspaceName })
        .eq("id", workspace.id)

      if (error) throw error

      toast({
        title: "Workspace updated",
        description: "Your workspace has been updated successfully.",
      })

      onClose()
    } catch (error) {
      console.error("Workspace update error:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your workspace.",
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
          <DialogTitle>Workspace Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex justify-center">
            <WorkspacePictureUpload
              workspaceId={workspace.id}
              currentPictureUrl={workspace.image_url}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspaceName">Workspace Name</Label>
            <Input
              id="workspaceName"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
