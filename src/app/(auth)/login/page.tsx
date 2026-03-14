import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Logo / Brand */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          SoloStylist
        </h1>
        <p className="mt-3 text-lg text-white/70 font-medium">
          Your business, your way
        </p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  )
}
