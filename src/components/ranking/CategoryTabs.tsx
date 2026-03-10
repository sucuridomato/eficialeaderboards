import { CATEGORY_LABELS, type RankingCategory } from '../../types/ranking'

interface CategoryTabsProps {
  activeCategory: RankingCategory
  onChange: (category: RankingCategory) => void
}

const categoryOptions: RankingCategory[] = [
  'questions',
  'flashcards',
  'totalMinutes',
  'reviewMinutes',
]

export function CategoryTabs({ activeCategory, onChange }: CategoryTabsProps) {
  return (
    <section className="ranking-filter-card" aria-label="Filtro de categoria">
      <div className="ranking-tabs ranking-tabs--categories">
        {categoryOptions.map((category) => (
          <button
            key={category}
            className={`ranking-tab ${activeCategory === category ? 'is-active' : ''}`}
            onClick={() => onChange(category)}
            type="button"
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>
    </section>
  )
}
