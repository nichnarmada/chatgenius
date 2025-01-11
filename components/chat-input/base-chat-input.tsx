import { useState, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Alert, AlertDescription } from "../ui/alert"
import { AlertCircle } from "lucide-react"
import { Loader2 } from "lucide-react"

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
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(content.trim())
      setContent("")
      // Focus the input after successful submission
      inputRef.current?.focus()
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
    <div className="w-full">
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
        <Input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="mr-2 flex-grow"
          disabled={disabled}
          autoFocus={autoFocus}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isLoading || disabled}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
