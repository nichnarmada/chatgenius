import { getWorkspaceData } from "./workspace-data"
import { WorkspaceLayout } from "./workspace-layout"

interface LayoutProps {
  children: React.ReactNode
  params: {
    workspaceId: string
  }
}

export default async function Layout({ children, params }: LayoutProps) {
  const { workspaceId } = await Promise.resolve(params)
  const data = await getWorkspaceData(workspaceId)

  return (
    <WorkspaceLayout {...data} workspaceId={workspaceId}>
      {children}
    </WorkspaceLayout>
  )
}
