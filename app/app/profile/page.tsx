'use client'

import { useSession, signOut } from 'next-auth/react'

export default function ProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-100 mb-2">Profile</h1>
      <p className="text-zinc-500 text-sm mb-8">Your account details</p>

      {session?.user && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4 max-w-sm">
          {session.user.image && (
            <img src={session.user.image} alt="" className="w-14 h-14 rounded-full" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-100 truncate">{session.user.name}</p>
            <p className="text-sm text-zinc-500 truncate">{session.user.email}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/signin' })}
        className="mt-6 px-4 py-2 rounded-lg text-sm text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
      >
        Sign out
      </button>
    </div>
  )
}
