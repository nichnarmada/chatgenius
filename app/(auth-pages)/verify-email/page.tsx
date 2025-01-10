export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="p-8 bg-card rounded-lg shadow-lg max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Check your email</h1>
        <p className="text-center text-muted-foreground">
          We&apos;ve sent you an email with a link to verify your account. Click
          the link to complete your registration and set up your profile.
        </p>
        <p className="text-sm text-center text-muted-foreground">
          Didn&apos;t receive an email? Check your spam folder.
        </p>
      </div>
    </div>
  )
}
