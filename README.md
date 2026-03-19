# Personal Finance

Portfolio Manager is a mobile-first personal finance app for tracking investments across brokers, banks, wallets, and manual assets.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Planned backend: Supabase
- Planned hosting: Vercel

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

Product and architecture notes live in [`docs/`](/Users/gadots/Documents/Codex/portfolio-manager/docs):

- [prd-v1.md](/Users/gadots/Documents/Codex/portfolio-manager/docs/prd-v1.md)
- [data-model.md](/Users/gadots/Documents/Codex/portfolio-manager/docs/data-model.md)
- [technical-architecture.md](/Users/gadots/Documents/Codex/portfolio-manager/docs/technical-architecture.md)
- [setup-supabase.md](/Users/gadots/Documents/Codex/portfolio-manager/docs/setup-supabase.md)

## Current Scope

- Interactive dashboard scaffold with local state
- Portfolio creation form
- Operation ledger form for BUY, SELL, DEPOSIT, and WITHDRAW
- Consolidated summary, portfolio summaries, and open positions
- Supabase environment scaffolding
- Initial SQL schema with RLS policies

## Next Build Steps

- Connect the UI to Supabase persistence
- Add Google SSO session flow
- Replace demo data with live queries
- Add CSV import and export flows
