export interface Channel {
  id: string
  name: string
}

export interface WorkspaceMember {
  user_id: string
  role: "owner" | "member"
}

export interface Workspace {
  id: string
  name: string
  image_url: string | null
  channels: Channel[]
  workspace_members: WorkspaceMember[]
}

export interface UserWorkspace {
  workspace: Workspace
}
