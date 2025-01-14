import { AvatarConfigForm } from "@/components/avatar/avatar-config-form"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"

type Params = Promise<{ workspaceId: string }>

interface AvatarSettingsPageProps {
  params: Params
}

export default async function AvatarSettingsPage({
  params,
}: AvatarSettingsPageProps) {
  const { workspaceId } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // This is a read-only operation in a Server Component
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch existing avatar config
  const { data: avatarConfig } = await supabase
    .from("avatar_configs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single()

  return (
    <ScrollArea className="h-full">
      <div className="flex h-full flex-1 flex-col p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Avatar Settings</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="max-w-3xl">
            <AvatarConfigForm
              workspaceId={workspaceId}
              initialData={avatarConfig}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
