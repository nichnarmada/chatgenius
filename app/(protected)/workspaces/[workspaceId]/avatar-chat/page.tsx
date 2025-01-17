import { getAvatarChats } from "./avatar-list-data"
import { AvatarChatList } from "./avatar-chat-list"

type PageProps = {
  params: Promise<{ workspaceId: string }>
}

export default async function Page({ params }: PageProps) {
  const { workspaceId } = await params
  const chats = await getAvatarChats(workspaceId)

  return <AvatarChatList workspaceId={workspaceId} initialChats={chats} />
}
