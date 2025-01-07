import { getDMData } from "./dm-data"
import { DMPage } from "./dm-page"

interface PageProps {
  params: {
    workspaceId: string
    userId: string
  }
}

export default async function Page({ params }: PageProps) {
  const { workspaceId, userId } = await Promise.resolve(params)
  const data = await getDMData(workspaceId, userId)

  return <DMPage {...data} />
}
