'use client'

import { useState, useEffect } from 'react'

function getConsent(): 'accepted' | 'declined' | null {
  try {
    const m = document.cookie.match(/(?:^|;\s*)vw-consent=([^;]*)/)
    return m ? (m[1] as 'accepted' | 'declined') : null
  } catch { return null }
}

function setConsent(value: 'accepted' | 'declined') {
  const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `vw-consent=${value}; expires=${exp}; path=/; SameSite=Lax`
}

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(getConsent() === null)
  }, [])

  const accept = () => {
    setConsent('accepted')
    setShow(false)
  }

  const decline = () => {
    setConsent('declined')
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('vw-'))
        .forEach((k) => localStorage.removeItem(k))
    } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-300 mb-0.5">We use cookies and local storage</p>
          <p className="text-xs text-zinc-500">
            To save your preferences, filters, and history between sessions.
            If you decline, the app still works but nothing is saved — each visit starts fresh.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={decline}
            className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export function cookieConsentDeclined(): boolean {
  if (typeof document === 'undefined') return false
  return /(?:^|;\s*)vw-consent=declined/.test(document.cookie)
}
