import { File } from "@/types/message"
import { Button } from "@/components/ui/button"
import { Trash2, Download } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface FileAttachmentProps {
  file: File
  canDelete?: boolean
  onDelete?: (fileId: string) => void
}

export function FileAttachment({
  file,
  canDelete,
  onDelete,
}: FileAttachmentProps) {
  const handleDelete = async () => {
    if (!onDelete) return

    try {
      const response = await fetch(`/api/files?fileId=${file.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      onDelete(file.id)
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleDownload = async () => {
    try {
      const supabase = createClient()
      const { data } = supabase.storage
        .from("message-files")
        .getPublicUrl(file.url)

      // Create a temporary link element to trigger the download
      const link = document.createElement("a")
      link.href = data.publicUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-secondary/50 p-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
        </Button>

        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
