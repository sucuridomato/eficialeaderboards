export type RankingPeriod = 'today' | 'week' | 'month' | 'all'

export type RankingCategory =
  | 'questions'
  | 'flashcards'
  | 'totalMinutes'
  | 'reviewMinutes'

export type RankingTrend = 'up' | 'down' | 'stable'

export interface RankingUser {
  id: string
  display_name: string
  avatar_initial: string
  questions: number
  flashcards: number
  total_minutes: number
  review_minutes: number
  trend: RankingTrend
  is_current_user?: boolean
}

export interface RankingEntry extends RankingUser {
  position: number
  value: number
}

export const PERIOD_LABELS: Record<RankingPeriod, string> = {
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
  all: 'Geral',
}

export const CATEGORY_LABELS: Record<RankingCategory, string> = {
  questions: 'Questões',
  flashcards: 'Flashcards',
  totalMinutes: 'Tempo total',
  reviewMinutes: 'Revisões',
}
