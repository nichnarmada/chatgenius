import { createClient } from "@/utils/supabase/server"
import { ChannelPage } from "./channel-page"
import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ workspaceId: string; channelId: string }>
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("*")
    .eq("id", resolvedParams.channelId)
    .single()

  if (channelError || !channel) {
    redirect("/")
  }

  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      *,
      profile:user_id (
        id,
        email,
        display_name,
        avatar_url
      ),
      reactions (
        id,
        emoji,
        user_id
      )
    `
    )
    .eq("channel_id", resolvedParams.channelId)
    .order("created_at", { ascending: true })
    .limit(50)

  return <ChannelPage channel={channel} messages={messages || []} />
}
