'use client'

import { useState, useTransition } from 'react'
import { signInWithMagicLink } from './actions'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await signInWithMagicLink(email.trim())
      // signInWithMagicLink redirects on success, so if we get here there's an error
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        {/* Email input */}
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            autoCapitalize="none"
            inputMode="email"
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

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-sm font-medium px-1" role="alert">
            {error}
          </p>
        )}

        {/* Submit button */}
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
              Sending link...
            </>
          ) : (
            'Send magic link'
          )}
        </button>
      </div>
    </form>
  )
}
