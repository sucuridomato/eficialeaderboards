import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface ProfileNameRow {
  display_name?: string | null
  apelido_publico?: string | null
  nome?: string | null
}

function isLikelyEmail(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  if (!normalized.includes('@')) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

function sanitizeName(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  if (isLikelyEmail(trimmed)) return ''
  return trimmed
}

async function readCurrentPublicName(userId: string): Promise<string> {
  const withDisplay = await supabase
    .from('profiles')
    .select('display_name,apelido_publico,nome')
    .eq('id', userId)
    .maybeSingle<ProfileNameRow>()

  let data = withDisplay.data

  if (withDisplay.error && withDisplay.error.message.includes('display_name')) {
    const withoutDisplay = await supabase
      .from('profiles')
      .select('apelido_publico,nome')
      .eq('id', userId)
      .maybeSingle<ProfileNameRow>()
    data = withoutDisplay.data
  }

  return (
    sanitizeName(data?.display_name) ||
    sanitizeName(data?.apelido_publico) ||
    sanitizeName(data?.nome)
  )
}

export function DisplayNameCard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return
      if (!user) {
        setUserId(null)
        setLoading(false)
        return
      }

      setUserId(user.id)
      const currentName = await readCurrentPublicName(user.id)

      if (!active) return
      setDraftName(currentName)
      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!userId) {
      setErrorMessage('Faça login para definir seu nome público.')
      return
    }

    const normalized = draftName.trim()

    if (normalized.length < 3) {
      setErrorMessage('O nome precisa ter ao menos 3 caracteres.')
      return
    }

    if (normalized.length > 24) {
      setErrorMessage('Use no máximo 24 caracteres.')
      return
    }

    if (isLikelyEmail(normalized)) {
      setErrorMessage('Use um apelido, não um e-mail.')
      return
    }

    setSaving(true)

    try {
      // 1) Preferred save path
      const rpcResult = await supabase.rpc('set_my_display_name', {
        p_display_name: normalized,
      })

      if (rpcResult.error && !rpcResult.error.message.includes('not authenticated')) {
        // Continue to fallback path
      }

      // Verify if it actually persisted
      let persistedName = await readCurrentPublicName(userId)
      if (persistedName.localeCompare(normalized, undefined, { sensitivity: 'accent' }) === 0) {
        setDraftName(persistedName)
        setSuccessMessage('Nome público salvo com sucesso.')
        return
      }

      // 2) Fallback with upsert for new users without profile row
      const basePayload = {
        id: userId,
        apelido_publico: normalized,
        nome: normalized,
        is_admin: false,
        current_streak: 0,
        best_streak: 0,
        created_at: new Date().toISOString(),
      }

      const upsertWithDisplay = await supabase.from('profiles').upsert(
        {
          ...basePayload,
          display_name: normalized,
        },
        { onConflict: 'id' },
      )

      if (upsertWithDisplay.error && upsertWithDisplay.error.message.includes('display_name')) {
        const legacyUpsert = await supabase
          .from('profiles')
          .upsert(basePayload, { onConflict: 'id' })

        if (legacyUpsert.error) {
          throw new Error(legacyUpsert.error.message)
        }
      } else if (upsertWithDisplay.error) {
        throw new Error(upsertWithDisplay.error.message)
      }

      persistedName = await readCurrentPublicName(userId)

      if (persistedName.localeCompare(normalized, undefined, { sensitivity: 'accent' }) !== 0) {
        throw new Error(
          'Não consegui confirmar a gravação no Supabase. Rode o script SQL novamente e teste.',
        )
      }

      setDraftName(persistedName)
      setSuccessMessage('Nome público salvo com sucesso.')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar agora. Tente novamente.'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <aside className="ranking-panel display-name-card">
      <div className="ranking-panel__header">
        <h2>Nome público</h2>
      </div>

      {loading ? (
        <p className="current-user-card__hint">Carregando seu perfil...</p>
      ) : userId ? (
        <>
          <p className="display-name-card__hint">
            Defina como você quer aparecer no ranking.
          </p>

          <form className="display-name-card__form" onSubmit={onSubmit}>
            <label htmlFor="display-name-input">Como você quer ser chamado?</label>
            <input
              id="display-name-input"
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={24}
              placeholder="Ex.: Thales"
              autoComplete="off"
            />
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar nome'}
            </button>
          </form>

          {successMessage ? <p className="display-name-card__success">{successMessage}</p> : null}
          {errorMessage ? <p className="display-name-card__error">{errorMessage}</p> : null}
        </>
      ) : (
        <p className="current-user-card__hint">
          Faça login para escolher seu nome no leaderboard.
        </p>
      )}
    </aside>
  )
}
