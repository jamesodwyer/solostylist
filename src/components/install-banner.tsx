'use client'

import { useEffect, useState } from 'react'
import { X, Upload } from 'lucide-react'

const DISMISS_COUNT_KEY = 'pwa_install_dismiss_count'
const DISMISS_TIME_KEY = 'pwa_install_dismiss_time'
const MAX_DISMISSALS = 2
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as typeof window & { MSStream?: unknown }).MSStream
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

function shouldShowBanner(): boolean {
  if (isStandalone()) return false

  const dismissCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) ?? '0', 10)
  if (dismissCount >= MAX_DISMISSALS) return false

  if (dismissCount > 0) {
    const lastDismiss = parseInt(localStorage.getItem(DISMISS_TIME_KEY) ?? '0', 10)
    if (Date.now() - lastDismiss < SEVEN_DAYS_MS) return false
  }

  return true
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (!shouldShowBanner()) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    if (ios) {
      // Show iOS instructions immediately
      setVisible(true)
      return
    }

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    const current = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) ?? '0', 10)
    localStorage.setItem(DISMISS_COUNT_KEY, String(current + 1))
    localStorage.setItem(DISMISS_TIME_KEY, String(Date.now()))
    setVisible(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-black text-white rounded-xl shadow-lg p-4">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-white/60 hover:text-white/90"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      {isIOSDevice ? (
        <div className="flex items-start gap-3 pr-6">
          <Upload size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Install SoloStylist</p>
            <p className="text-white/80 text-xs mt-0.5">
              Tap the Share button, then &ldquo;Add to Home Screen&rdquo;
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pr-4">
          <div>
            <p className="font-semibold text-sm">Add SoloStylist to your home screen</p>
            <p className="text-white/70 text-xs mt-0.5">Quick access, works offline</p>
          </div>
          <button
            onClick={handleInstall}
            className="ml-4 bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
          >
            Install
          </button>
        </div>
      )}
    </div>
  )
}
