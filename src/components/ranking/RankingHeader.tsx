interface RankingHeaderProps {
  onSignOut: () => void | Promise<void>
}

export function RankingHeader({ onSignOut }: RankingHeaderProps) {
  return (
    <header className="ranking-header">
      <div>
        <p className="ranking-header__eyebrow">Performance dos estudos</p>
        <h1>Ranking</h1>
        <p className="ranking-header__subtitle">Acompanhe os destaques dos estudos</p>
      </div>

      <div className="ranking-header__actions">
        <div className="ranking-header__icon" aria-hidden>
          <svg viewBox="0 0 24 24" role="img" aria-label="troféu">
            <path d="M17 3H7v2H4v3a5 5 0 0 0 5 5h.1A5.98 5.98 0 0 0 11 16.7V19H8v2h8v-2h-3v-2.3A5.98 5.98 0 0 0 14.9 13H15a5 5 0 0 0 5-5V5h-3V3Zm-9 7a3 3 0 0 1-2-2.83V7h2v3Zm10-2.83A3 3 0 0 1 16 10V7h2v.17Z" />
          </svg>
        </div>

        <button className="ranking-header__logout" onClick={() => void onSignOut()} type="button">
          Sair
        </button>
      </div>
    </header>
  )
}
