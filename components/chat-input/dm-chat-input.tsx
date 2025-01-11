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
    <BaseChatInput
      onSubmit={onSubmit}
      placeholder={`Message ${recipientName}`}
      disabled={disabled}
    />
  )
}
