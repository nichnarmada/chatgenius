"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AvatarUpload } from "@/components/avatar-upload"
import { createClient } from "@/utils/supabase/client"

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  profile: any
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  user,
  profile,
}: ProfileSettingsModalProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleImageSelect = (file: File) => {
    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Upload avatar if a new file was selected
      let avatarUrl = profile?.avatar_url
      if (selectedFile) {
        const formData = new FormData()
        formData.append("avatar", selectedFile)

        const response = await fetch("/api/users/avatar", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to upload avatar")
        }

        const data = await response.json()
        avatarUrl = data.avatarUrl
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      onClose()
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Clean up preview URL and reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset image states
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setSelectedFile(null)
      }
      // Reset display name to original value
      setDisplayName(profile?.display_name || "")
    }
  }, [isOpen, previewUrl, profile?.display_name])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex justify-center">
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url}
              previewUrl={previewUrl}
              onImageSelect={handleImageSelect}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email} disabled className="bg-muted" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
