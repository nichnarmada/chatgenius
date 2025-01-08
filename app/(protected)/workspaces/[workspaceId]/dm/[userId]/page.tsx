import { DMPage } from "./dm-page"
import { getDMData } from "./dm-data"

type PageProps = {
  params: Promise<{ workspaceId: string; userId: string }>
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params
  const data = await getDMData(
    resolvedParams.workspaceId,
    resolvedParams.userId
  )

  return <DMPage {...data} />
}
