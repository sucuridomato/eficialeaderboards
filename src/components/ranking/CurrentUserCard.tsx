import { formatRankingMetric } from '../../lib/rankingFormat'
import {
  CATEGORY_LABELS,
  PERIOD_LABELS,
  type RankingCategory,
  type RankingEntry,
  type RankingPeriod,
} from '../../types/ranking'

interface CurrentUserCardProps {
  currentUser?: RankingEntry
  period: RankingPeriod
  category: RankingCategory
}

function getMotivation(position: number): string {
  if (position <= 3) return 'Ritmo de elite. Continue sustentando seu foco.'
  if (position <= 10) return 'Você está perto do Top 10. Mantenha a consistência.'
  return 'Cada sessão conta. Continue revisando para subir no ranking.'
}

export function CurrentUserCard({ currentUser, period, category }: CurrentUserCardProps) {
  return (
    <aside className="ranking-panel current-user-card">
      <div className="ranking-panel__header">
        <h2>Sua posição</h2>
      </div>

      {currentUser ? (
        <>
          <p className="current-user-card__period">Seu desempenho em {PERIOD_LABELS[period]}</p>
          <p className="current-user-card__position">
            #{currentUser.position} em {CATEGORY_LABELS[category]}
          </p>
          <p className="current-user-card__value">
            Você fez {formatRankingMetric(currentUser.value, category)}
          </p>
          <p className="current-user-card__hint">{getMotivation(currentUser.position)}</p>
        </>
      ) : (
        <p className="current-user-card__hint">
          Sem dados disponíveis para mostrar sua posição neste período.
        </p>
      )}
    </aside>
  )
}
