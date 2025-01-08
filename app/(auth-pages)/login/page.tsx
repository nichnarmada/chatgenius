import { signInAction } from "@/app/actions"
import { FormMessage, Message } from "@/components/form-message"
import { LoginForm } from "./login-form"
import { ThemeSwitcher } from "@/components/theme-switcher"

type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Login({ searchParams }: SearchParamsProps) {
  // Await the searchParams promise
  const params = await searchParams

  // Convert searchParams to Message type
  const messageParams: Message = params.error
    ? { error: params.error as string }
    : params.success
      ? { success: params.success as string }
      : params.message
        ? { message: params.message as string }
        : { message: "" }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">ChatGenius</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <LoginForm messageParams={messageParams} />
      </div>
    </div>
  )
}
