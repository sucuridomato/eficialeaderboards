import type { RankingCategory, RankingEntry } from '../../types/ranking'
import { LeaderboardListItem } from './LeaderboardListItem'

interface LeaderboardListProps {
  entries: RankingEntry[]
  category: RankingCategory
}

export function LeaderboardList({ entries, category }: LeaderboardListProps) {
  return (
    <section className="ranking-panel">
      <div className="ranking-panel__header">
        <h2>Classificação geral</h2>
      </div>

      {entries.length > 0 ? (
        <ul className="leaderboard-list">
          {entries.map((entry) => (
            <LeaderboardListItem key={entry.id} entry={entry} category={category} />
          ))}
        </ul>
      ) : (
        <p className="current-user-card__hint">
          Ainda não há mais usuários com pontuação nesta categoria.
        </p>
      )}
    </section>
  )
}
