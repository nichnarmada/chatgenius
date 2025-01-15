"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  system_prompt: z.string().min(1, "System prompt is required"),
  temperature: z.number().min(0).max(2),
  context_length: z.number().min(1).max(20),
  active: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

interface AvatarConfigFormProps {
  workspaceId: string
  initialData?: {
    id: string
    name: string
    system_prompt: string
    temperature: number
    context_length: number
    active: boolean
  }
}

export function AvatarConfigForm({
  workspaceId,
  initialData,
}: AvatarConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      system_prompt: initialData?.system_prompt ?? "",
      temperature: initialData?.temperature ?? 0.7,
      context_length: initialData?.context_length ?? 10,
      active: initialData?.active ?? false,
    },
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("avatar_configs").upsert({
        id: initialData?.id,
        workspace_id: workspaceId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...data,
      })

      toast.success("Avatar settings saved!")
    } catch (error) {
      toast.error(
        `Failed to save avatar settings: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
        <div className="space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle
                  className={
                    !form.watch("active") ? "text-muted-foreground/50" : ""
                  }
                >
                  Basic Configuration
                </CardTitle>
                <CardDescription
                  className={
                    !form.watch("active") ? "text-muted-foreground/40" : ""
                  }
                >
                  Configure your avatar&apos;s basic settings and personality.
                </CardDescription>
              </div>
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardHeader>
            {form.watch("active") && (
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My AI Assistant" {...field} />
                      </FormControl>
                      <FormDescription>
                        A name for your AI avatar.
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
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature ({field.value})</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={2}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Controls randomness in responses (0 = focused, 2 =
                        creative)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="context_length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Context Length ({field.value} messages)
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={20}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of previous messages to include as context
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>
        </div>

        {form.watch("active") && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}

const defaultSystemPrompt = `You are an AI avatar that represents me in conversations. Your responses should reflect my personality, communication style, and knowledge based on my message history. You should:

1. Maintain consistency with my typical communication style
2. Use context from my previous messages
3. Be helpful and professional while staying true to my personality
4. Acknowledge when you're unsure about something
5. Keep responses concise and to the point

Remember that you're representing me, so maintain appropriate boundaries and professionalism.`
