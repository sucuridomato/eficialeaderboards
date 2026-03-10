import { formatRankingMetric } from '../../lib/rankingFormat'
import type { RankingCategory, RankingEntry } from '../../types/ranking'

interface TopThreeLeaderboardProps {
  entries: RankingEntry[]
  category: RankingCategory
}

function getMedalLabel(position: number): string {
  if (position === 1) return 'Ouro'
  if (position === 2) return 'Prata'
  return 'Bronze'
}

export function TopThreeLeaderboard({ entries, category }: TopThreeLeaderboardProps) {
  const topThree = entries.filter((entry) => entry.position <= 3)

  return (
    <section className="ranking-panel">
      <div className="ranking-panel__header">
        <h2>Top 3</h2>
      </div>

      <div className="top-three-grid">
        {topThree.map((entry) => (
          <article
            key={entry.id}
            className={`top-three-card top-three-card--${entry.position}`}
            aria-label={`${entry.position} lugar ${entry.display_name}`}
          >
            <span className="top-three-card__place">{entry.position}o</span>
            <div className="top-three-card__avatar">{entry.avatar_initial}</div>
            <p className="top-three-card__name">{entry.display_name}</p>
            <p className="top-three-card__value">{formatRankingMetric(entry.value, category)}</p>
            <p className="top-three-card__medal">{getMedalLabel(entry.position)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
