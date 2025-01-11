import { Message } from "@/components/form-message"
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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">ChatGenius</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <LoginForm messageParams={messageParams} />
      </div>
    </div>
  )
}
