"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateWorkspaceForm({
  createWorkspace,
}: {
  createWorkspace: (formData: FormData) => Promise<void>
}) {
  const router = useRouter()

  return (
    <form action={createWorkspace} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Workspace image</Label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
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

      <div className="flex gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.back()}
          type="button"
        >
          Cancel
        </Button>
        <Button type="submit" className="w-full">
          Create Workspace
        </Button>
      </div>
    </form>
  )
}
