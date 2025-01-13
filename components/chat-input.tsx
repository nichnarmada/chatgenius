import { useState, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Loader2 } from "lucide-react"

export interface ChatInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  defaultValue?: string
  showError?: boolean
  className?: string
  isLoading?: boolean
  error?: string | null
}

export function ChatInput({
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  autoFocus = false,
  defaultValue = "",
  showError = false,
  className = "",
  isLoading = false,
  error = null,
}: ChatInputProps) {
  const [content, setContent] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    const isEnterKey = e.key === "Enter"
    const hasShiftKey = e.shiftKey

    // Enter to submit, Shift+Enter for new line
    if (
      isEnterKey &&
      !hasShiftKey &&
      !disabled &&
      !isLoading &&
      content.trim()
    ) {
      e.preventDefault()
      onSubmit(content.trim())
      setContent("")
      // Focus the input after successful submission
      inputRef.current?.focus()
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
      <div className={`flex h-full items-center ${className}`}>
        <Input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="mr-2 flex-grow"
          disabled={disabled || isLoading}
          autoFocus={autoFocus}
        />
        <Button
          type="button"
          size="sm"
          disabled={!content.trim() || isLoading || disabled}
          onClick={() => {
            if (content.trim()) {
              onSubmit(content.trim())
              setContent("")
              inputRef.current?.focus()
            }
          }}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export interface MessageInputProps {
  onSubmit: (content: string) => Promise<void>
  defaultValue?: string
  autoFocus?: boolean
  onCancel: () => void
}

export function MessageInput({
  onSubmit,
  defaultValue = "",
  autoFocus = false,
  onCancel,
}: MessageInputProps) {
  return (
    <div className="flex gap-2">
      <ChatInput
        onSubmit={onSubmit}
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Edit message..."
        className="flex-1"
      />
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
