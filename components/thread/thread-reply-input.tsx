import { useState } from "react"
import { MessageInput } from "../message-input"
import { Alert, AlertDescription } from "../ui/alert"
import { AlertCircle } from "lucide-react"

interface ThreadReplyInputProps {
  onSend: (content: string) => Promise<void>
}

export function ThreadReplyInput({ onSend }: ThreadReplyInputProps) {
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (content: string) => {
    try {
      setError(null)
      await onSend(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply")
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <MessageInput placeholder="Reply to thread..." onSubmit={handleSend} />
    </div>
  )
}
