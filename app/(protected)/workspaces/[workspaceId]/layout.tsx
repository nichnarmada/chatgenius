import LayoutWrapper from "./layout-wrapper"

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { workspaceId: string }
}) {
  return <LayoutWrapper params={params}>{children}</LayoutWrapper>
}
