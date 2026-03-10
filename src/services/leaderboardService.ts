import { supabase } from '../lib/supabaseClient'
import type { RankingCategory, RankingEntry, RankingPeriod, RankingTrend } from '../types/ranking'

interface DailyLogRow {
  user_id: string | null
  date: string | null
  questoes: number | null
  flashcards: number | null
  tempo_estudo: number | null
  minutos_revisao: number | null
}

interface ProfileRow {
  id: string
  apelido_publico: string | null
  nome: string | null
}

interface WeeklyLeaderboardRpcRow {
  nome: string | null
  streak: number | null
  questoes: number | null
  flashcards: number | null
  minutos_revisao: number | null
  [key: string]: unknown
}

interface AggregatedUserMetrics {
  questions: number
  flashcards: number
  total_minutes: number
  review_minutes: number
  current_window_metric: number
  previous_window_metric: number
}

const currentUserId = import.meta.env.VITE_CURRENT_USER_ID as string | undefined
const currentUserName = import.meta.env.VITE_CURRENT_USER_NAME as string | undefined

const weeklyPeriodScale: Record<RankingPeriod, number> = {
  today: 1 / 7,
  week: 1,
  month: 4,
  all: 16,
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDays(reference: Date, days: number): Date {
  const shifted = new Date(reference)
  shifted.setDate(shifted.getDate() - days)
  return shifted
}

function getPeriodWindow(period: RankingPeriod): {
  startDate: string | null
  endDate: string
  midpointDate: string | null
} {
  const now = new Date()
  const endDate = formatDateKey(now)

  if (period === 'today') {
    return { startDate: endDate, endDate, midpointDate: null }
  }

  if (period === 'week') {
    const start = shiftDays(now, 6)
    const midpoint = shiftDays(now, 3)
    return {
      startDate: formatDateKey(start),
      endDate,
      midpointDate: formatDateKey(midpoint),
    }
  }

  if (period === 'month') {
    const start = shiftDays(now, 29)
    const midpoint = shiftDays(now, 14)
    return {
      startDate: formatDateKey(start),
      endDate,
      midpointDate: formatDateKey(midpoint),
    }
  }

  return { startDate: null, endDate, midpointDate: null }
}

function metricFromCategory(
  metrics: Pick<
    AggregatedUserMetrics,
    'questions' | 'flashcards' | 'total_minutes' | 'review_minutes'
  >,
  category: RankingCategory,
): number {
  switch (category) {
    case 'questions':
      return metrics.questions
    case 'flashcards':
      return metrics.flashcards
    case 'totalMinutes':
      return metrics.total_minutes
    case 'reviewMinutes':
      return metrics.review_minutes
  }
}

function metricFromLog(log: DailyLogRow, category: RankingCategory): number {
  switch (category) {
    case 'questions':
      return log.questoes ?? 0
    case 'flashcards':
      return log.flashcards ?? 0
    case 'totalMinutes':
      return log.tempo_estudo ?? 0
    case 'reviewMinutes':
      return log.minutos_revisao ?? 0
  }
}

function resolveTrend(
  period: RankingPeriod,
  currentWindowMetric: number,
  previousWindowMetric: number,
): RankingTrend {
  if (period === 'today' || period === 'all') return 'stable'
  if (currentWindowMetric > previousWindowMetric * 1.08) return 'up'
  if (previousWindowMetric > currentWindowMetric * 1.08) return 'down'
  return 'stable'
}

function sanitizeDisplayName(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function avatarInitialFromName(name: string): string {
  const firstLetter = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .charAt(0)
    .toUpperCase()
  return firstLetter || '?'
}

function parseNumericValue(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function buildStableIdFromName(name: string, index: number): string {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return normalized ? `${normalized}-${index + 1}` : `usuario-${index + 1}`
}

function resolveRpcTrend(streak: number): RankingTrend {
  if (streak >= 3) return 'up'
  if (streak <= 0) return 'down'
  return 'stable'
}

function extractTotalMinutesFromRpc(row: WeeklyLeaderboardRpcRow): number {
  const candidates = [
    'total_minutes',
    'total_minutos',
    'tempo_estudo',
    'minutos_estudo',
    'tempo_total',
    'minutos_total',
  ]

  for (const key of candidates) {
    const value = row[key]
    const numericValue = parseNumericValue(value)
    if (numericValue > 0) return numericValue
  }

  const fallbackFromQuestions = parseNumericValue(row.questoes) * 2
  const fallbackFromReview = parseNumericValue(row.minutos_revisao)
  return Math.round(fallbackFromQuestions + fallbackFromReview)
}

function scaleWeeklyMetric(value: number, period: RankingPeriod): number {
  return Math.max(Math.round(value * weeklyPeriodScale[period]), 0)
}

async function fetchFromDailyLogs(
  period: RankingPeriod,
  category: RankingCategory,
): Promise<RankingEntry[]> {
  const { startDate, endDate, midpointDate } = getPeriodWindow(period)

  let logsQuery = supabase
    .from('daily_logs')
    .select('user_id,date,questoes,flashcards,tempo_estudo,minutos_revisao')

  if (period === 'today') {
    logsQuery = logsQuery.eq('date', endDate)
  } else if (startDate) {
    logsQuery = logsQuery.gte('date', startDate).lte('date', endDate)
  }

  const { data: logsData, error: logsError } = await logsQuery.range(0, 4999)
  if (logsError) {
    throw new Error(logsError.message)
  }

  const logs = (logsData ?? []) as DailyLogRow[]
  if (!logs.length) {
    return []
  }

  const aggregatedByUser = new Map<string, AggregatedUserMetrics>()

  for (const log of logs) {
    if (!log.user_id) continue

    const existing = aggregatedByUser.get(log.user_id) ?? {
      questions: 0,
      flashcards: 0,
      total_minutes: 0,
      review_minutes: 0,
      current_window_metric: 0,
      previous_window_metric: 0,
    }

    existing.questions += log.questoes ?? 0
    existing.flashcards += log.flashcards ?? 0
    existing.total_minutes += log.tempo_estudo ?? 0
    existing.review_minutes += log.minutos_revisao ?? 0

    if (midpointDate && log.date) {
      if (log.date >= midpointDate) {
        existing.current_window_metric += metricFromLog(log, category)
      } else {
        existing.previous_window_metric += metricFromLog(log, category)
      }
    }

    aggregatedByUser.set(log.user_id, existing)
  }

  if (!aggregatedByUser.size) {
    return []
  }

  const userIds = [...aggregatedByUser.keys()]
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id,apelido_publico,nome')
    .in('id', userIds)

  const profileById = new Map(
    (
      profilesError ? [] : ((profilesData ?? []) as ProfileRow[])
    ).map((profile) => [profile.id, profile]),
  )

  const entries: Omit<RankingEntry, 'position'>[] = []

  for (const userId of userIds) {
    const metrics = aggregatedByUser.get(userId)
    if (!metrics) continue

    const profile = profileById.get(userId)
    const displayName =
      sanitizeDisplayName(profile?.apelido_publico) ??
      sanitizeDisplayName(profile?.nome) ??
      `Usuario ${userId.slice(0, 4)}`

    const categoryValue = metricFromCategory(metrics, category)
    const isCurrentUser =
      (currentUserId && userId === currentUserId) ||
      (currentUserName &&
        displayName.localeCompare(currentUserName, undefined, { sensitivity: 'accent' }) === 0)

    if (categoryValue <= 0) {
      continue
    }

    entries.push({
      id: userId,
      display_name: displayName,
      avatar_initial: avatarInitialFromName(displayName),
      questions: metrics.questions,
      flashcards: metrics.flashcards,
      total_minutes: metrics.total_minutes,
      review_minutes: metrics.review_minutes,
      trend: resolveTrend(period, metrics.current_window_metric, metrics.previous_window_metric),
      is_current_user: Boolean(isCurrentUser),
      value: categoryValue,
    })
  }

  return entries
    .sort((a, b) => {
      const diff = b.value - a.value
      if (diff !== 0) return diff
      return a.display_name.localeCompare(b.display_name)
    })
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }))
}

async function fetchFromWeeklyRpc(
  period: RankingPeriod,
  category: RankingCategory,
): Promise<RankingEntry[]> {
  const { data, error } = await supabase.rpc('get_weekly_leaderboard')

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as WeeklyLeaderboardRpcRow[]
  if (!rows.length) {
    return []
  }

  const entries: Omit<RankingEntry, 'position'>[] = []

  rows.forEach((row, index) => {
    const displayName =
      sanitizeDisplayName(row.nome) ??
      sanitizeDisplayName(typeof row.display_name === 'string' ? row.display_name : null) ??
      `Usuário ${index + 1}`

    const questions = scaleWeeklyMetric(parseNumericValue(row.questoes), period)
    const flashcards = scaleWeeklyMetric(parseNumericValue(row.flashcards), period)
    const reviewMinutes = scaleWeeklyMetric(parseNumericValue(row.minutos_revisao), period)
    const totalMinutes = scaleWeeklyMetric(extractTotalMinutesFromRpc(row), period)

    const categoryValue = metricFromCategory(
      {
        questions,
        flashcards,
        total_minutes: totalMinutes,
        review_minutes: reviewMinutes,
      },
      category,
    )

    if (categoryValue <= 0) return

    const isCurrentUser =
      (currentUserName &&
        displayName.localeCompare(currentUserName, undefined, { sensitivity: 'accent' }) ===
          0) ||
      false

    entries.push({
      id: buildStableIdFromName(displayName, index),
      display_name: displayName,
      avatar_initial: avatarInitialFromName(displayName),
      questions,
      flashcards,
      total_minutes: totalMinutes,
      review_minutes: reviewMinutes,
      trend: resolveRpcTrend(parseNumericValue(row.streak)),
      is_current_user: isCurrentUser,
      value: categoryValue,
    })
  })

  return entries
    .sort((a, b) => {
      const diff = b.value - a.value
      if (diff !== 0) return diff
      return a.display_name.localeCompare(b.display_name)
    })
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }))
}

export async function fetchLeaderboard(
  period: RankingPeriod,
  category: RankingCategory,
): Promise<RankingEntry[]> {
  try {
    const dailyEntries = await fetchFromDailyLogs(period, category)
    if (dailyEntries.length > 0) {
      return dailyEntries
    }
  } catch {
    // Se a leitura direta falhar por política/permissão, segue para RPC de leaderboard.
  }

  return fetchFromWeeklyRpc(period, category)
}

export function subscribeToLeaderboardUpdates(onChange: () => void): () => void {
  const channel = supabase
    .channel('ranking-live-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'daily_logs' },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'revisoes' },
      () => onChange(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
