import type { RankingCategory } from '../types/ranking'

const numberFormatter = new Intl.NumberFormat('pt-BR')

export function formatRankingMetric(value: number, category: RankingCategory): string {
  const formattedValue = numberFormatter.format(value)
  switch (category) {
    case 'questions':
      return `${formattedValue} questões`
    case 'flashcards':
      return `${formattedValue} flashcards`
    case 'totalMinutes':
      return `${formattedValue} min`
    case 'reviewMinutes':
      return `${formattedValue} min de revisão`
  }
}
