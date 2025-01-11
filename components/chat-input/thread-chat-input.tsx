import { BaseChatInput } from "./base-chat-input"

interface ThreadChatInputProps {
  onSubmit: (content: string) => Promise<void>
  disabled?: boolean
}

export function ThreadChatInput({ onSubmit, disabled }: ThreadChatInputProps) {
  return (
    <BaseChatInput
      onSubmit={onSubmit}
      placeholder="Reply to thread..."
      disabled={disabled}
      showError={true}
    />
  )
}
