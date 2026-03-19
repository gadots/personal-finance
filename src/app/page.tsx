export default function Home() {
  return (
    <main className="grain min-h-screen overflow-hidden">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[rgba(255,250,241,0.06)] text-sm font-semibold tracking-[0.24em] text-[var(--color-mint)]">
              PF
            </div>
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-[rgba(246,241,232,0.56)]">
                Personal Finance
              </p>
              <p className="text-sm text-[rgba(246,241,232,0.72)]">
                Portfolio manager scaffold
              </p>
            </div>
          </div>
          <div className="rounded-full border border-[var(--color-line)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[rgba(246,241,232,0.7)]">
            v0 foundation
          </div>
        </header>

        <div className="grid gap-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-12">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(138,227,192,0.3)] bg-[rgba(138,227,192,0.08)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--color-mint)]">
              Consolidated wealth view
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold leading-none tracking-[-0.05em] text-[var(--color-paper-strong)] sm:text-6xl lg:text-7xl">
                One mobile-first home for every broker, wallet, and manual asset.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[rgba(246,241,232,0.72)] sm:text-lg">
                This foundation is ready for Google sign-in, portfolio-level
                tracking, operation-ledger accounting, consolidated FX-aware
                valuation, and CSV-based imports.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#roadmap"
                className="flex items-center justify-center rounded-full bg-[var(--color-paper-strong)] px-6 py-3 text-sm font-medium text-[var(--color-ink)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Review product foundation
              </a>
              <a
                href="#roadmap"
                className="flex items-center justify-center rounded-full border border-[var(--color-line)] px-6 py-3 text-sm font-medium text-[var(--color-paper)] transition-colors duration-200 hover:bg-[rgba(255,250,241,0.06)]"
              >
                See build blocks
              </a>
            </div>
          </section>

          <aside className="card-sheen rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[rgba(246,241,232,0.46)]">
                  Preview
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper-strong)]">
                  Portfolio snapshot
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(138,227,192,0.16)] px-3 py-1 font-mono text-xs text-[var(--color-mint)]">
                Live-ready
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[1.5rem] bg-[rgba(255,250,241,0.05)] p-4">
                <p className="text-xs uppercase tracking-[0.26em] text-[rgba(246,241,232,0.46)]">
                  Total value
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                  $248,420
                </p>
                <p className="mt-2 text-sm text-[rgba(138,227,192,0.9)]">
                  +6.24% unrealized P&amp;L
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.25rem] border border-[var(--color-line)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[rgba(246,241,232,0.46)]">
                    Brokers
                  </p>
                  <p className="mt-3 text-2xl font-semibold">5</p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--color-line)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[rgba(246,241,232,0.46)]">
                    Positions
                  </p>
                  <p className="mt-3 text-2xl font-semibold">31</p>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.5rem] border border-[var(--color-line)] p-4">
                {[
                  { label: "IBKR", value: "38%", tone: "bg-[var(--color-mint)]" },
                  { label: "Bank", value: "26%", tone: "bg-[var(--color-sand)]" },
                  { label: "Crypto", value: "19%", tone: "bg-[var(--color-coral)]" },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[rgba(246,241,232,0.8)]">{item.label}</span>
                      <span className="font-mono text-[rgba(246,241,232,0.62)]">
                        {item.value}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(255,250,241,0.08)]">
                      <div
                        className={`h-2 rounded-full ${item.tone}`}
                        style={{ width: item.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section
          id="roadmap"
          className="grid gap-4 pb-6 md:grid-cols-3 md:gap-5"
        >
          {[
            {
              id: "01",
              title: "Portfolio model",
              body: "Named portfolios represent brokers, banks, wallets, or any account container you define.",
            },
            {
              id: "02",
              title: "Operation ledger",
              body: "BUY, SELL, DEPOSIT, and WITHDRAW remain the source of truth for position and cash calculations.",
            },
            {
              id: "03",
              title: "Pricing engine",
              body: "Quoted assets pull from external market data while private assets keep manual valuation support.",
            },
          ].map((item) => (
            <article key={item.id} className="card-sheen rounded-[1.75rem] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[rgba(246,241,232,0.44)]">
                {item.id}
              </p>
              <h3 className="mt-4 text-xl font-semibold text-[var(--color-paper-strong)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[rgba(246,241,232,0.68)]">
                {item.body}
              </p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
