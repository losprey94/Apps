import { useState, useEffect } from 'react'

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(() => window.__pwa?.getPrompt() || null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS Safari
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Detect if already installed as standalone PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    setIsInstalled(standalone)

    // Pick up a prompt that was captured before this component mounted
    const existing = window.__pwa?.getPrompt()
    if (existing) setInstallPrompt(existing)

    // Listen for prompt captured after this component mounts
    const onReady = () => {
      const p = window.__pwa?.getPrompt()
      if (p) setInstallPrompt(p)
    }
    window.addEventListener('pwa-prompt-ready', onReady)

    // Also listen directly (fallback)
    const onPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      window.__pwa?.clearPrompt()
    })

    return () => {
      window.removeEventListener('pwa-prompt-ready', onReady)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])

  const triggerInstall = async () => {
    if (!installPrompt) return false
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      window.__pwa?.clearPrompt()
      return true
    }
    return false
  }

  const canInstall = !isInstalled && (installPrompt !== null || isIOS)

  return { canInstall, isInstalled, isIOS, hasPrompt: !!installPrompt, triggerInstall }
}
