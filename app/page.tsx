'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold tracking-tight">Vibe Watch</span>
        {session ? (
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
            <button
              onClick={() => router.push('/app')}
              className="px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Open App
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('google', { callbackUrl: '/app' })}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Log in
          </button>
        )}
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-6xl mx-auto px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center py-20">

          {/* Left: text */}
          <div className="space-y-8">
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              Бывает ли такое, что вы&nbsp;
              <span className="text-amber-500">подолгу выбираете фильм?</span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Vibe Watch учитывает ваше настроение, предпочтения и сервисы — и мгновенно находит фильм, который подойдёт именно вам.
            </p>
            <button
              onClick={() => router.push('/app')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-black font-semibold text-lg hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Давай найдём фильм для тебя →
            </button>
          </div>

          {/* Right: decorative mock */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-3 gap-3 opacity-90">
              {[
                { bg: 'from-violet-900 to-indigo-900', title: 'Cosmic Drift', year: '2023', rating: '8.4' },
                { bg: 'from-rose-900 to-pink-900', title: 'Last Summer', year: '2022', rating: '7.9' },
                { bg: 'from-amber-900 to-orange-900', title: 'Wildfire', year: '2024', rating: '8.1' },
              ].map((card) => (
                <div key={card.title} className={`bg-gradient-to-b ${card.bg} rounded-xl aspect-[2/3] p-3 flex flex-col justify-end border border-white/10`}>
                  <p className="text-xs font-semibold text-white leading-tight">{card.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{card.year} · ★ {card.rating}</p>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Value props */}
        <div className="grid md:grid-cols-2 gap-6 pb-24">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-3">
            <div className="text-3xl">🎬</div>
            <h3 className="text-xl font-semibold">Смотришь один</h3>
            <p className="text-zinc-400 leading-relaxed">
              Слишком много вариантов, которые не учитывают твоё настроение. Просто скажи Vibe Watch, что тебе хочется — и он подберёт фильмы под тебя.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-3">
            <div className="text-3xl">👥</div>
            <h3 className="text-xl font-semibold">Смотришь с компанией</h3>
            <p className="text-zinc-400 leading-relaxed">
              Все хотят разного и вы долго скролите кинотеатры. Vibe Watch учитывает пожелания всех и подбирает фильмы, которые подойдут каждому.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
