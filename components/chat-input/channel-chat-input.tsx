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
    <div className="h-[60px] min-h-[60px] border-t p-4">
      <BaseChatInput
        onSubmit={onSubmit}
        placeholder={`Message #${channelName}`}
        disabled={disabled}
      />
    </div>
  )
}
