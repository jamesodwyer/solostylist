'use client'

import { useState, useTransition } from 'react'
import { signInWithPassword, signUp } from './actions'

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError(null)
    setSuccess(null)

    startTransition(async () => {
      if (mode === 'signup') {
        const result = await signUp(email.trim(), password)
        if (result?.error) {
          setError(result.error)
        } else if (result?.success) {
          setSuccess('Check your email to confirm your account, then sign in.')
          setMode('signin')
        }
      } else {
        const result = await signInWithPassword(email.trim(), password)
        if (result?.error) {
          setError(result.error)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
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

        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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

        {success && (
          <p className="text-green-400 text-sm font-medium px-1" role="status">
            {success}
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
              {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
            </>
          ) : (
            mode === 'signup' ? 'Create account' : 'Sign in'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setSuccess(null)
          }}
          disabled={isPending}
          className="
            w-full py-3 text-sm text-white/60 font-medium
            hover:text-white/80 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {mode === 'signin'
            ? "Don't have an account? Create one"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </form>
  )
}
