import { BaseChatInput } from "./base-chat-input"

interface DMChatInputProps {
  recipientName: string
  onSubmit: (content: string) => Promise<void>
  disabled?: boolean
}

export function DMChatInput({
  recipientName,
  onSubmit,
  disabled,
}: DMChatInputProps) {
  return (
    <div className="h-[60px] min-h-[60px] border-t p-4">
      <BaseChatInput
        onSubmit={onSubmit}
        placeholder={`Message ${recipientName}`}
        disabled={disabled}
      />
    </div>
  )
}
