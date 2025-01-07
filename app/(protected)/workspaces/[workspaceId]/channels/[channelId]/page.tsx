import { getChannelData } from "./channel-data"
import { ChannelPage } from "./channel-page"

interface PageProps {
  params: {
    workspaceId: string
    channelId: string
  }
}

export default async function Page({ params }: PageProps) {
  const { workspaceId, channelId } = await Promise.resolve(params)
  const data = await getChannelData(workspaceId, channelId)

  return <ChannelPage {...data} />
}
