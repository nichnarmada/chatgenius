export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-card p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold">Check your email</h1>
        <p className="text-center text-muted-foreground">
          We&apos;ve sent you an email with a link to verify your account. Click
          the link to complete your registration and set up your profile.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive an email? Check your spam folder.
        </p>
      </div>
    </div>
  )
}
