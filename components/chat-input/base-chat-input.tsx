import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Alert, AlertDescription } from "../ui/alert"
import { AlertCircle } from "lucide-react"

export interface BaseChatInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  defaultValue?: string
  showError?: boolean
  className?: string
}

export function BaseChatInput({
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  autoFocus = false,
  defaultValue = "",
  showError = false,
  className = "",
}: BaseChatInputProps) {
  const [content, setContent] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(content.trim())
      setContent("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const isEnterKey = e.key === "Enter"
    const hasShiftKey = e.shiftKey

    // Enter to submit, Shift+Enter for new line
    if (isEnterKey && !hasShiftKey) {
      e.preventDefault()
      handleSubmit(e)
      return
    }
  }

  return (
    <div className="space-y-2">
      {showError && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={handleSubmit}
        className={`flex h-full items-center ${className}`}
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="mr-2 min-h-[44px] flex-grow resize-none"
          disabled={isLoading || disabled}
          autoFocus={autoFocus}
        />
        <Button type="submit" disabled={isLoading || disabled}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
