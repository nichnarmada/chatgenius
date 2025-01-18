"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { Slider } from "@/components/ui/slider"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  system_prompt: z.string().min(1, "System prompt is required"),
  source_type: z.enum(["channel", "user"]),
  source_id: z.string().min(1, "Source is required"),
  message_history_limit: z.number().min(10).max(40),
})

type FormValues = z.infer<typeof formSchema>

interface Source {
  id: string
  name: string
}

interface AvatarConfigFormProps {
  workspaceId: string
  initialData?: {
    id: string
    name: string
    system_prompt: string
    source_type: "channel" | "user"
    source_id: string
    message_history_limit: number
  }
  onSuccess?: (configId: string) => void
}

const defaultSystemPrompt = `You are an AI assistant that helps users by providing informative and helpful responses based on the context of the conversation and any relevant documents or messages. Your responses should be:

1. Accurate and based on the available context
2. Clear and well-structured
3. Helpful and solution-oriented
4. Professional yet conversational in tone

When referencing information, clearly indicate whether it comes from chat messages, documents, or other sources.`

export function AvatarConfigForm({
  workspaceId,
  initialData,
  onSuccess,
}: AvatarConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [channels, setChannels] = useState<Source[]>([])
  const [users, setUsers] = useState<Source[]>([])
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      system_prompt: initialData?.system_prompt ?? defaultSystemPrompt,
      source_type: initialData?.source_type ?? "channel",
      source_id: initialData?.source_id ?? "",
      message_history_limit: initialData?.message_history_limit ?? 20,
    },
  })

  // Fetch channels and users when the component mounts
  useEffect(() => {
    async function fetchSources() {
      // Fetch channels
      const { data: channelsData } = await supabase
        .from("channels")
        .select("id, name")
        .eq("workspace_id", workspaceId)
        .order("name")

      if (channelsData) {
        setChannels(
          channelsData.map((channel) => ({
            id: channel.id,
            name: channel.name,
          }))
        )
      }

      // Fetch workspace members
      const { data: membersData } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspaceId)

      if (membersData) {
        const memberIds = membersData.map((m) => m.user_id)
        const { data: usersData } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", memberIds)

        if (usersData) {
          setUsers(
            usersData.map((user) => ({
              id: user.id,
              name: user.display_name || user.email,
            }))
          )
        }
      }
    }

    fetchSources()
  }, [workspaceId, supabase])

  async function onSubmit(data: FormValues) {
    console.log("Form submission started with data:", data)
    setIsLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("Error fetching user:", userError)
        throw userError
      }
      console.log("User data fetched:", userData)

      // First, check if an avatar config already exists for this source
      const { data: existingConfig, error: fetchError } = await supabase
        .from("avatar_configs")
        .select()
        .eq("workspace_id", workspaceId)
        .eq("source_type", data.source_type)
        .eq("source_id", data.source_id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "not found"
        console.error("Error fetching existing config:", fetchError)
        throw fetchError
      }

      // Get or create the avatar config
      let avatarConfig
      if (!existingConfig) {
        // Create new config if none exists
        const { data: newConfig, error: createError } = await supabase
          .from("avatar_configs")
          .insert({
            name: data.name,
            system_prompt: data.system_prompt,
            source_type: data.source_type,
            source_id: data.source_id,
            created_by_user_id: userData.user.id,
            workspace_id: workspaceId,
            embedding_settings: {
              recent_messages_count: data.message_history_limit,
              similarity_threshold: 0.7,
              max_context_messages: 10,
              include_recent_messages: true,
            },
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating avatar config:", createError)
          throw createError
        }
        avatarConfig = newConfig
      } else {
        avatarConfig = existingConfig
      }

      // Create a new chat instance using the avatar config
      const { data: chat, error: chatError } = await supabase
        .from("avatar_chats")
        .insert({
          config_id: avatarConfig.id,
          created_by_user_id: userData.user.id,
          title: data.name,
          source_type: data.source_type as "channel" | "user",
          source_id: data.source_id,
          workspace_id: workspaceId,
        })
        .select()
        .single()

      if (chatError) {
        console.error("Error creating chat:", chatError)
        throw chatError
      }

      console.log("Chat created successfully:", chat)

      if (chat) {
        // Initialize embeddings for the new chat
        const response = await fetch("/api/avatars/initialize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chatId: chat.id }),
        })

        if (!response.ok) {
          console.error("Error initializing embeddings:", await response.json())
        }

        if (onSuccess) {
          console.log("Calling onSuccess with chat.id:", chat.id)
          onSuccess(chat.id)
        } else {
          console.log("Redirecting to avatar chat page")
          router.push(`/workspaces/${workspaceId}/avatar-chat/${chat.id}`)
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Error in onSubmit:", {
        error,
        formData: data,
        workspaceId,
        initialData,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sourceType = form.watch("source_type")
  const sources = sourceType === "channel" ? channels : users

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Name</FormLabel>
              <FormControl>
                <Input placeholder="My AI Assistant" {...field} />
              </FormControl>
              <FormDescription>A name for your AI avatar.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a source type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="channel">Channel</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose whether this avatar represents a channel or a user.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${sourceType}`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the {sourceType} this avatar will represent.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="system_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="You are an AI avatar that represents me in conversations..."
                  className="min-h-[240px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Define your avatar&apos;s personality and behavior.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message_history_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message History Limit</FormLabel>
              <FormControl>
                <div className="flex flex-col space-y-4">
                  <Slider
                    min={10}
                    max={40}
                    step={5}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {field.value} messages
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Number of recent messages to use for avatar context (10-40
                messages).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save Changes" : "Create Avatar"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
