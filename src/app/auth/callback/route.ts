import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Exchange succeeded — determine where to send the user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if the user has completed onboarding
        // The profiles row is auto-created by the DB trigger on auth.users INSERT
        // onboarding_completed defaults to false for new users
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        return NextResponse.redirect(`${origin}/diary`)
      }

      // User not found after exchange — redirect to diary as fallback
      return NextResponse.redirect(`${origin}/diary`)
    }
  }

  // No code or exchange failed — redirect back to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
