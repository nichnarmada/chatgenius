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
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onChannelCreated?: (channel: any) => void
}

export function CreateChannelModal({
  isOpen,
  onClose,
  workspaceId,
  onChannelCreated,
}: CreateChannelModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create channel")
      }

      // Close modal
      onClose()

      // Notify parent about the new channel
      onChannelCreated?.(data)

      // Redirect to the new channel
      router.push(`/workspaces/${workspaceId}/channels/${data.id}`)

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Error creating channel:", error)
      setError(
        error instanceof Error ? error.message : "Failed to create channel"
      )
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new channel</DialogTitle>
        </DialogHeader>

        <form action={onSubmit} className="mt-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Channel name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. announcements"
              required
              autoFocus
              onChange={() => setError(null)}
            />
          </div>

          <input type="hidden" name="workspaceId" value={workspaceId} />

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create channel"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
