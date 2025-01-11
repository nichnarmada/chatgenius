import { BaseChatInput } from "./base-chat-input"

interface ChannelChatInputProps {
  channelName: string
  onSubmit: (content: string) => Promise<void>
  disabled?: boolean
}

export function ChannelChatInput({
  channelName,
  onSubmit,
  disabled,
}: ChannelChatInputProps) {
  return (
    <BaseChatInput
      onSubmit={onSubmit}
      placeholder={`Message #${channelName}`}
      disabled={disabled}
      autoFocus={true}
    />
  )
}
