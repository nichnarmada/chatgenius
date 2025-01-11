"use client"

import { useState } from "react"
import { Upload, File as FileIcon } from "lucide-react"
import { Button } from "./ui/button"
import { useToast } from "./ui/use-toast"

interface FileUploadProps {
  channelId?: string
  dmId?: string
  workspaceId: string
  onUploadComplete?: (file: any) => void
}

export function FileUpload({
  channelId,
  dmId,
  workspaceId,
  onUploadComplete,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("workspaceId", workspaceId)
      if (channelId) formData.append("channelId", channelId)
      if (dmId) formData.append("dmId", dmId)

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      onUploadComplete?.(data)

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        onChange={handleFileChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        disabled={isUploading}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={isUploading}
      >
        <Upload className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface FilePreviewProps {
  file: {
    file_name: string
    file_url: string
    file_type: string
    file_size: number
  }
}

export function FilePreview({ file }: FilePreviewProps) {
  const isImage = file.file_type.startsWith("image/")
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      {isImage ? (
        <img
          src={file.file_url}
          alt={file.file_name}
          className="h-10 w-10 rounded object-cover"
        />
      ) : (
        <FileIcon className="h-10 w-10" />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{file.file_name}</span>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(file.file_size)}
        </span>
      </div>
    </div>
  )
}
