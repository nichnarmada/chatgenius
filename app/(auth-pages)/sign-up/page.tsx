"use client"

import { signUpAction } from "@/app/actions"
import { FormMessage, Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useEffect } from "react"

export default function Signup({ searchParams }: { searchParams: Message }) {
  const { toast } = useToast()

  useEffect(() => {
    if ("success" in searchParams) {
      toast({
        title: "Success",
        description: searchParams.success,
      })
    } else if ("error" in searchParams) {
      toast({
        variant: "destructive",
        title: "Error",
        description: searchParams.error,
      })
    }
  }, [searchParams, toast])

  if ("message" in searchParams) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <FormMessage message={searchParams} />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center relative px-4">
        <div className="absolute top-4 right-4">
          <ThemeSwitcher />
        </div>

        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">ChatGenius</h1>
            <p className="text-muted-foreground">Create your account</p>
          </div>

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

            <FormMessage message={searchParams} />

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
        </div>
      </div>
      <Toaster />
    </>
  )
}
