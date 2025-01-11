import { getChannelData } from "./channel-data"
import { ChannelPage } from "./channel-page"

type PageProps = {
  params: Promise<{ workspaceId: string; channelId: string }>
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params

  const { channel, messages } = await getChannelData(
    resolvedParams.workspaceId,
    resolvedParams.channelId
  )

  return <ChannelPage channel={channel} messages={messages} />
}
