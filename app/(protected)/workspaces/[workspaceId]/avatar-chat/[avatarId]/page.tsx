import { getAvatarData } from "./avatar-data"
import { AvatarPage } from "./avatar-page"

type PageProps = {
  params: Promise<{ workspaceId: string; avatarId: string }>
}

export default async function Page({ params }: PageProps) {
  const { workspaceId, avatarId } = await params
  console.log("Fetching data for workspace:", workspaceId, "avatar:", avatarId)

  const chat = await getAvatarData(workspaceId, avatarId)
  console.log("Raw chat data:", {
    id: chat.id,
    title: chat.title,
    config: chat.config,
    messageCount: chat.messages?.length || 0,
  })

  // Ensure chat.config exists (getAvatarData already checks this and redirects if not)
  if (!chat.config) {
    throw new Error("Avatar config not found")
  }

  // Messages are already in the correct format with query and response
  const messages = chat.messages || []
  console.log(
    "Messages:",
    messages.map((m) => ({
      id: m.id,
      query: m.query,
      response: m.response,
      created_at: m.created_at,
    }))
  )

  return (
    <AvatarPage
      workspaceId={workspaceId}
      avatarConfig={chat.config}
      messages={messages}
      chatId={avatarId}
    />
  )
}
