import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-black tracking-tight mb-4">
        Welcome to SoloStylist!
      </h1>

      {/* Subtext */}
      <p className="text-black/60 text-base font-medium max-w-xs leading-relaxed mb-10">
        Let&apos;s get your business set up.
      </p>

      {/* Continue button — Phase 2 will replace this with the real onboarding flow */}
      <div className="w-full max-w-sm">
        <Link
          href="/diary"
          className="
            block w-full py-4 px-6 rounded-xl
            bg-black text-white
            text-base font-bold text-center
            hover:bg-black/90 active:bg-black/80
            transition-colors min-h-[56px] flex items-center justify-center
          "
        >
          Continue
        </Link>
      </div>
    </main>
  )
}
