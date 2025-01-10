"use client"

import { createClient } from "@/utils/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AvatarUpload } from "@/components/avatar-upload"

export default function SetupProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleImageSelect = (file: File) => {
    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const form = e.currentTarget

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("No user found")
      }

      const displayName = (
        form.elements.namedItem("displayName") as HTMLInputElement
      ).value

      // Upload avatar if selected
      let avatarUrl = null
      if (selectedFile) {
        const avatarFormData = new FormData()
        avatarFormData.append("avatar", selectedFile)

        const response = await fetch("/api/users/avatar", {
          method: "POST",
          body: avatarFormData,
        })

        if (!response.ok) {
          throw new Error("Failed to upload avatar")
        }

        const data = await response.json()
        avatarUrl = data.url
      }

      // Check if profile exists
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)

      const profileExists = profiles && profiles.length > 0

      if (!profileExists) {
        // Create profile if it doesn't exist
        const { error: createError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          display_name: displayName,
          avatar_url: avatarUrl,
          is_profile_setup: true,
        })
        if (createError) throw createError
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            display_name: displayName,
            ...(avatarUrl && { avatar_url: avatarUrl }),
            is_profile_setup: true,
          })
          .eq("id", user.id)
        if (updateError) throw updateError
      }

      router.push("/workspaces")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="p-8 bg-card rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Set Up Your Profile
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <AvatarUpload
              currentAvatarUrl={null}
              previewUrl={previewUrl}
              onImageSelect={handleImageSelect}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="How should we call you?"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Setting up..." : "Complete Setup"}
          </Button>
        </form>
      </div>
      <Toaster />
    </div>
  )
}
