import { useCallback, useEffect, useMemo, useState } from 'react'
import { CategoryTabs } from '../components/ranking/CategoryTabs'
import { CurrentUserCard } from '../components/ranking/CurrentUserCard'
import { EmptyLeaderboardState } from '../components/ranking/EmptyLeaderboardState'
import { LeaderboardList } from '../components/ranking/LeaderboardList'
import { PeriodTabs } from '../components/ranking/PeriodTabs'
import { RankingHeader } from '../components/ranking/RankingHeader'
import { TopThreeLeaderboard } from '../components/ranking/TopThreeLeaderboard'
import {
  fetchLeaderboard,
  subscribeToLeaderboardUpdates,
} from '../services/leaderboardService'
import type { RankingCategory, RankingEntry, RankingPeriod } from '../types/ranking'
import './RankingPage.css'

export function RankingPage() {
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('week')
  const [activeCategory, setActiveCategory] = useState<RankingCategory>('questions')
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const loadLeaderboard = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true)

      try {
        const data = await fetchLeaderboard(activePeriod, activeCategory)
        setEntries(data)
        setErrorMessage(null)
        setLastSyncAt(new Date().toLocaleTimeString('pt-BR'))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro inesperado ao carregar.'
        setErrorMessage(message)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    },
    [activeCategory, activePeriod],
  )

  useEffect(() => {
    void loadLeaderboard(true)

    const unsubscribe = subscribeToLeaderboardUpdates(() => {
      void loadLeaderboard(false)
    })

    const intervalId = window.setInterval(() => {
      void loadLeaderboard(false)
    }, 30000)

    return () => {
      unsubscribe()
      window.clearInterval(intervalId)
    }
  }, [loadLeaderboard])

  const topThree = useMemo(() => entries.slice(0, 3), [entries])
  const remainingEntries = useMemo(() => entries.slice(3), [entries])
  const currentUser = useMemo(
    () => entries.find((entry) => entry.is_current_user),
    [entries],
  )

  return (
    <main className="ranking-shell">
      <div className="ranking-shell__glow ranking-shell__glow--top" aria-hidden />
      <div className="ranking-shell__glow ranking-shell__glow--bottom" aria-hidden />

      <div className="ranking-page">
        <RankingHeader />
        <PeriodTabs activePeriod={activePeriod} onChange={setActivePeriod} />
        <CategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />

        <p className="ranking-live-chip">
          Tempo real ativo
          {lastSyncAt ? ` - Ultima atualizacao as ${lastSyncAt}` : ''}
        </p>

        {errorMessage ? (
          <section className="ranking-panel ranking-error">
            <h2>Nao foi possivel carregar o ranking agora.</h2>
            <p>{errorMessage}</p>
          </section>
        ) : null}

        {isLoading ? (
          <section className="ranking-panel ranking-loading">
            <h2>Carregando ranking...</h2>
            <p>Buscando dados reais do Supabase.</p>
          </section>
        ) : null}

        {!isLoading && !errorMessage ? (
          entries.length === 0 ? (
            <div className="ranking-layout">
              <div className="ranking-layout__main">
                <EmptyLeaderboardState />
              </div>
              <div className="ranking-layout__side">
                <CurrentUserCard
                  currentUser={currentUser}
                  period={activePeriod}
                  category={activeCategory}
                />
              </div>
            </div>
          ) : (
            <div className="ranking-layout" key={`${activePeriod}-${activeCategory}`}>
              <div className="ranking-layout__main">
                <TopThreeLeaderboard entries={topThree} category={activeCategory} />
                <LeaderboardList entries={remainingEntries} category={activeCategory} />
              </div>
              <div className="ranking-layout__side">
                <CurrentUserCard
                  currentUser={currentUser}
                  period={activePeriod}
                  category={activeCategory}
                />
              </div>
            </div>
          )
        ) : null}
      </div>
    </main>
  )
}
