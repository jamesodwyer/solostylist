import { BottomNav } from '@/components/bottom-nav'
import { InstallBanner } from '@/components/install-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
      <InstallBanner />
    </div>
  )
}
