"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Camera } from "lucide-react"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onImageSelect?: (file: File) => void
  previewUrl?: string | null
}

export function AvatarUpload({
  currentAvatarUrl,
  onImageSelect,
  previewUrl,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image under 5MB.")
      return
    }

    onImageSelect?.(file)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image under 5MB.")
      return
    }

    onImageSelect?.(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const imageUrl = previewUrl || currentAvatarUrl || ""

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="group relative cursor-pointer"
    >
      <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Profile"
            width={80}
            height={80}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
        <Camera className="h-6 w-6 text-white" />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
