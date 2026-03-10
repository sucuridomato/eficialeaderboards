import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import './AuthPage.css'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setErrorMessage('Preencha e-mail e senha.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        setErrorMessage(error.message)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível entrar agora.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-shell__glow auth-shell__glow--top" aria-hidden />
      <div className="auth-shell__glow auth-shell__glow--bottom" aria-hidden />

      <section className="auth-card" aria-label="Login do leaderboard">
        <p className="auth-card__eyebrow">Acesso protegido</p>
        <h1>Entrar no Leaderboard</h1>
        <p className="auth-card__subtitle">
          Faça login com sua conta do Supabase para ver e atualizar seu ranking.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">E-mail</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />

          <label htmlFor="auth-password">Senha</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            autoComplete="current-password"
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {errorMessage ? <p className="auth-card__error">{errorMessage}</p> : null}
      </section>
    </main>
  )
}
