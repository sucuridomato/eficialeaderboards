export function EmptyLeaderboardState() {
  return (
    <section className="ranking-panel empty-state">
      <div className="empty-state__icon" aria-hidden>
        #
      </div>
      <h2>Nenhum ranking disponivel ainda neste periodo.</h2>
      <p>
        Assim que os usuarios registrarem estudos, o ranking sera atualizado em tempo real.
      </p>
    </section>
  )
}
