'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Download, RefreshCw, Share, X } from 'lucide-react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

const subscribeInstalled = (onStoreChange: () => void) => {
  const displayMode = window.matchMedia('(display-mode: standalone)')
  displayMode.addEventListener('change', onStoreChange)
  window.addEventListener('appinstalled', onStoreChange)

  return () => {
    displayMode.removeEventListener('change', onStoreChange)
    window.removeEventListener('appinstalled', onStoreChange)
  }
}

const getInstalledSnapshot = () => {
  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    standaloneNavigator.standalone === true
  )
}

const subscribeNever = () => () => {}
const getIosSnapshot = () => {
  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean
  }
  const installed =
    window.matchMedia('(display-mode: standalone)').matches ||
    standaloneNavigator.standalone === true
  const appleTouchDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  return appleTouchDevice && !installed
}
const getServerSnapshot = () => false

export function RegisterServiceWorker() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  )
  const isIos = useSyncExternalStore(
    subscribeNever,
    getIosSnapshot,
    getServerSnapshot,
  )
  const isInstalled = useSyncExternalStore(
    subscribeInstalled,
    getInstalledSnapshot,
    getServerSnapshot,
  )
  const [dismissedInstall, setDismissedInstall] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const handleAppInstalled = () => {
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    let reloadedForUpdate = false
    const handleControllerChange = () => {
      if (reloadedForUpdate) return
      reloadedForUpdate = true
      window.location.reload()
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        handleControllerChange,
      )
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          if (registration.waiting && navigator.serviceWorker.controller) {
            setWaitingWorker(registration.waiting)
          }

          registration.addEventListener('updatefound', () => {
            const installing = registration.installing
            installing?.addEventListener('statechange', () => {
              if (
                installing.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setWaitingWorker(installing)
              }
            })
          })

          void registration.update().catch(() => {
            // A failed update check does not affect the installed application.
          })
        })
        .catch(() => {
          // The application remains usable when service workers are unavailable.
        })
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          handleControllerChange,
        )
      }
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const installVisible =
    !isInstalled && !dismissedInstall && (installPrompt !== null || isIos)

  return (
    <>
      {waitingWorker ? (
        <div className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border bg-background p-3 shadow-xl lg:bottom-4">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <RefreshCw className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Atualização disponível</p>
            <p className="text-xs text-muted-foreground">
              Instala a versão mais recente do MoneyFlow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => waitingWorker.postMessage({ type: 'SKIP_WAITING' })}
            className="min-h-10 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Atualizar
          </button>
        </div>
      ) : null}

      {installVisible ? (
        <div className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-md items-start gap-3 rounded-2xl border bg-background p-3 shadow-xl lg:bottom-4">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            {isIos ? (
              <Share className="size-4" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Instala o MoneyFlow</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {isIos
                ? 'No Safari, abre Partilhar e escolhe “Adicionar ao ecrã principal”.'
                : 'Abre a aplicação diretamente do ecrã principal, como qualquer outra app.'}
            </p>
            {installPrompt ? (
              <button
                type="button"
                onClick={() => void install()}
                className="mt-2 min-h-9 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                Instalar aplicação
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setDismissedInstall(true)}
            aria-label="Fechar sugestão de instalação"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  )
}
