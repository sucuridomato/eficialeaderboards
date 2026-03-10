import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import { AuthPage } from './pages/AuthPage'
import { RankingPage } from './pages/RankingPage'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isBootingSession, setIsBootingSession] = useState(true)

  useEffect(() => {
    let mounted = true

    const hydrateSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session ?? null)
      setIsBootingSession(false)
    }

    void hydrateSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsBootingSession(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (isBootingSession) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="auth-card__eyebrow">Acesso protegido</p>
          <h1>Carregando sessão...</h1>
        </section>
      </main>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return <RankingPage onSignOut={async () => {
    await supabase.auth.signOut()
  }} />
}

export default App
