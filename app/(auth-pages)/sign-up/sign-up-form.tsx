"use client"

import { signUpAction } from "@/app/actions"
import { FormMessage, Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useEffect } from "react"

interface SignUpFormProps {
  messageParams: Message
}

export function SignUpForm({ messageParams }: SignUpFormProps) {
  const { toast } = useToast()

  useEffect(() => {
    if ("success" in messageParams) {
      toast({
        title: "Success",
        description: messageParams.success,
      })
    } else if ("error" in messageParams) {
      toast({
        variant: "destructive",
        title: "Error",
        description: messageParams.error,
      })
    }
  }, [messageParams, toast])

  if ("message" in messageParams) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <FormMessage message={messageParams} />
      </div>
    )
  }

  return (
    <>
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Create a password"
            minLength={6}
            required
          />
        </div>

        <SubmitButton
          className="w-full"
          formAction={signUpAction}
          pendingText="Creating account..."
        >
          Create account
        </SubmitButton>

        <FormMessage message={messageParams} />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
      <Toaster />
    </>
  )
}
