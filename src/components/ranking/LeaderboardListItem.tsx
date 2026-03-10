import { formatRankingMetric } from '../../lib/rankingFormat'
import type { RankingCategory, RankingEntry } from '../../types/ranking'

interface LeaderboardListItemProps {
  entry: RankingEntry
  category: RankingCategory
}

const trendLabel = {
  up: 'Subiu',
  down: 'Caiu',
  stable: 'Estavel',
}

export function LeaderboardListItem({ entry, category }: LeaderboardListItemProps) {
  return (
    <li className={`leaderboard-item ${entry.is_current_user ? 'leaderboard-item--self' : ''}`}>
      <span className="leaderboard-item__position">#{entry.position}</span>

      <div className="leaderboard-item__identity">
        <div className="leaderboard-item__avatar">{entry.avatar_initial}</div>
        <p className="leaderboard-item__name">{entry.display_name}</p>
      </div>

      <p className="leaderboard-item__value">{formatRankingMetric(entry.value, category)}</p>
      <span className={`leaderboard-item__trend leaderboard-item__trend--${entry.trend}`}>
        {trendLabel[entry.trend]}
      </span>
    </li>
  )
}
