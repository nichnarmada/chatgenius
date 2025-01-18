import { getAvatarData } from "./avatar-data"
import { AvatarPage } from "./avatar-page"

type PageProps = {
  params: Promise<{ workspaceId: string; avatarId: string }>
}

export default async function Page({ params }: PageProps) {
  const { workspaceId, avatarId } = await params

  const chat = await getAvatarData(workspaceId, avatarId)

  // Ensure chat.config exists (getAvatarData already checks this and redirects if not)
  if (!chat.config) {
    throw new Error("Avatar config not found")
  }

  // Transform messages to match the expected format
  const messages =
    chat.messages?.map((msg) => ({
      id: msg.id,
      query: msg.query,
      response: msg.response,
      created_at: msg.created_at,
    })) || []

  return (
    <AvatarPage
      workspaceId={workspaceId}
      avatarConfig={chat.config}
      messages={messages}
      chatId={avatarId}
    />
  )
}
