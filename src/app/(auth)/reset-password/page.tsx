'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        router.push('/diary')
      }
    })
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center mb-10">
        <h1 className="text-4xl font-black italic text-white tracking-tight">
          SoloStylist
        </h1>
        <p className="mt-3 text-lg text-white/70 font-medium">
          Set a new password
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="new-password" className="sr-only">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              required
              disabled={isPending}
              className="
                w-full px-4 py-4 rounded-xl
                bg-white/10 border border-white/20
                text-white placeholder:text-white/40
                text-base font-medium
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-medium px-1" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="
              w-full py-4 px-6 rounded-xl
              bg-white text-black
              text-base font-bold
              hover:bg-white/90 active:bg-white/80
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors min-h-[56px]
              flex items-center justify-center gap-2
            "
          >
            {isPending ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"
                  aria-hidden="true"
                />
                Updating...
              </>
            ) : (
              'Update password'
            )}
          </button>
        </div>
      </form>
    </main>
  )
}
