import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      {/* Mail icon */}
      <div className="mb-8 flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border border-white/20">
        <Mail size={36} strokeWidth={1.5} className="text-white" />
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold text-white tracking-tight mb-4">
        Check your inbox
      </h1>

      {/* Body */}
      <p className="text-white/70 text-base font-medium max-w-xs leading-relaxed mb-10">
        We&apos;ve sent a magic link to your email.
        <br />
        Tap it to sign in — no password needed.
      </p>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        {/* Resend — go back to login to enter email again */}
        <Link
          href="/login"
          className="
            block w-full py-4 px-6 rounded-xl
            bg-white text-black
            text-base font-bold text-center
            hover:bg-white/90 active:bg-white/80
            transition-colors min-h-[56px] flex items-center justify-center
          "
        >
          Resend link
        </Link>

        {/* Back to login — secondary link */}
        <Link
          href="/login"
          className="
            block w-full py-3 px-6 rounded-xl
            text-white/60 text-sm font-medium text-center
            hover:text-white transition-colors
          "
        >
          Back to login
        </Link>
      </div>
    </main>
  )
}
