import { useRef, useState, KeyboardEvent } from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { SendHorizontal, X } from "lucide-react"

interface MessageInputProps {
  onSubmit: (content: string) => void
  onCancel?: () => void
  defaultValue?: string
  placeholder?: string
  autoFocus?: boolean
}

export function MessageInput({
  onSubmit,
  onCancel,
  defaultValue = "",
  placeholder = "Type a message...",
  autoFocus = false,
}: MessageInputProps) {
  const [content, setContent] = useState(defaultValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmedContent = content.trim()
    if (trimmedContent) {
      onSubmit(trimmedContent)
      setContent("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (value: string) => {
    setContent(value)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleTextareaChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[44px] resize-none pr-12"
          autoFocus={autoFocus}
        />
        <div className="absolute right-3 top-0 bottom-0 flex items-center">
          <Button size="icon" onClick={handleSubmit} disabled={!content.trim()}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {onCancel && (
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
