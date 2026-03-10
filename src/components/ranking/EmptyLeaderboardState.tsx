export function EmptyLeaderboardState() {
  return (
    <section className="ranking-panel empty-state">
      <div className="empty-state__icon" aria-hidden>
        #
      </div>
      <h2>Nenhum ranking disponível ainda neste período.</h2>
      <p>
        Assim que os usuários registrarem estudos, o ranking será atualizado em tempo real.
      </p>
    </section>
  )
}
