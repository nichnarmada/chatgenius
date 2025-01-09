"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Camera, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { useToast } from "./ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"

interface WorkspacePictureUploadProps {
  workspaceId: string
  currentPictureUrl?: string | null
}

export function WorkspacePictureUpload({
  workspaceId,
  currentPictureUrl,
}: WorkspacePictureUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("picture", selectedFile)

      const response = await fetch(`/api/workspaces/${workspaceId}/picture`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      toast({
        title: "Picture updated",
        description: "Your workspace picture has been updated successfully.",
      })

      // Cleanup and close dialog
      setSelectedFile(null)
      setPreviewUrl(null)
      setIsOpen(false)

      // Refresh the page to show the new picture
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error uploading your workspace picture.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted">
            {currentPictureUrl ? (
              <>
                <Image
                  src={currentPictureUrl}
                  alt="Workspace"
                  width={80}
                  height={80}
                  className="object-cover"
                  onError={(e) => {
                    console.error("Image load error:", e)
                    // Fallback to camera icon on error
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const parent = target.parentElement
                    if (parent) {
                      const div = document.createElement("div")
                      div.className =
                        "h-full w-full flex items-center justify-center bg-muted"
                      const camera = document.createElement("div")
                      camera.className = "h-8 w-8 text-muted-foreground"
                      camera.innerHTML = "<svg>...</svg>" // Camera icon SVG
                      div.appendChild(camera)
                      parent.appendChild(div)
                    }
                  }}
                />
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Workspace Picture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="h-40 w-40 rounded-lg overflow-hidden bg-muted">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={160}
                  height={160}
                  className="object-cover"
                />
              ) : currentPictureUrl ? (
                <Image
                  src={currentPictureUrl}
                  alt="Current"
                  width={160}
                  height={160}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="workspace-picture-upload"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={triggerFileInput}
              disabled={isUploading || isPending}
            >
              Choose Image
            </Button>
            {selectedFile && (
              <Button
                onClick={handleUpload}
                disabled={isUploading || isPending}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
