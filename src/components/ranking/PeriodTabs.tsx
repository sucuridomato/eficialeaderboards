import { PERIOD_LABELS, type RankingPeriod } from '../../types/ranking'

interface PeriodTabsProps {
  activePeriod: RankingPeriod
  onChange: (period: RankingPeriod) => void
}

const periodOptions: RankingPeriod[] = ['today', 'week', 'month', 'all']

export function PeriodTabs({ activePeriod, onChange }: PeriodTabsProps) {
  return (
    <section className="ranking-filter-card" aria-label="Filtro de período">
      <div className="ranking-tabs">
        {periodOptions.map((period) => (
          <button
            key={period}
            className={`ranking-tab ${activePeriod === period ? 'is-active' : ''}`}
            onClick={() => onChange(period)}
            type="button"
          >
            {PERIOD_LABELS[period]}
          </button>
        ))}
      </div>
    </section>
  )
}
