import { useState, useRef } from "react"
import { Send, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Loader2 } from "lucide-react"

export interface ChatInputProps {
  onSubmit: (content: string, files?: File[]) => Promise<void>
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    const isEnterKey = e.key === "Enter"
    const hasShiftKey = e.shiftKey

    // Enter to submit, Shift+Enter for new line
    if (
      isEnterKey &&
      !hasShiftKey &&
      !disabled &&
      !isLoading &&
      (content.trim() || selectedFiles.length > 0)
    ) {
      e.preventDefault()
      onSubmit(content.trim(), selectedFiles)
      setContent("")
      setSelectedFiles([])
      // Focus the input after successful submission
      inputRef.current?.focus()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
    e.target.value = "" // Reset input
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full">
      {showError && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedFiles.length > 0 && (
        <div className="mb-2 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-secondary/50 p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
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

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          multiple
        />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="mr-2"
          disabled={disabled || isLoading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={
            (!content.trim() && selectedFiles.length === 0) ||
            isLoading ||
            disabled
          }
          onClick={() => {
            if (content.trim() || selectedFiles.length > 0) {
              onSubmit(content.trim(), selectedFiles)
              setContent("")
              setSelectedFiles([])
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
        onSubmit={(content) => onSubmit(content)}
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
