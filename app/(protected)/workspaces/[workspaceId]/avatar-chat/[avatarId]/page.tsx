import { getAvatarData } from "./avatar-data"
import { AvatarPage } from "./avatar-page"

type PageProps = {
  params: Promise<{ workspaceId: string; avatarId: string }>
}

export default async function Page({ params }: PageProps) {
  const { workspaceId, avatarId } = await params

  const { avatarConfig, messages } = await getAvatarData(workspaceId, avatarId)

  return (
    <AvatarPage
      workspaceId={workspaceId}
      avatarConfig={avatarConfig}
      messages={messages}
    />
  )
}
