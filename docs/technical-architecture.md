# Portfolio Manager Technical Architecture v1

## Recommended Stack

- Frontend: Next.js App Router with TypeScript
- Hosting: Vercel
- Database: Supabase Postgres
- Auth: Supabase Auth with Google provider
- Storage: Supabase Storage for generated CSV files when needed
- Background jobs: Supabase scheduled functions or Vercel cron plus server actions and route handlers
- Styling: Tailwind CSS with a custom component system
- Validation: Zod
- Charts: lightweight chart library optimized for mobile rendering

## Why This Stack

- Low operational overhead.
- Cheap to host at MVP scale.
- Google SSO and Postgres are straightforward with Supabase.
- Vercel works very well with Next.js for mobile-first product delivery.
- TypeScript and Zod reduce runtime mistakes around financial calculations and imports.

## System Overview

### Client Layer

Mobile-first responsive web app with these main surfaces:

- sign-in
- dashboard
- portfolio list
- portfolio detail
- operation ledger
- add operation flow
- CSV import flow
- instrument resolution flow
- settings

### Application Layer

Use Next.js route handlers and server actions for:

- authenticated CRUD operations
- CSV validation and ingestion
- instrument search and resolution
- position calculation queries
- market price refresh triggers
- backup export triggers

### Data Layer

Supabase Postgres stores:

- users
- portfolios
- instruments
- operations
- manual valuations
- latest prices
- latest FX rates
- import batches and errors
- backup export metadata

### Integration Layer

External providers:

- Google OAuth through Supabase Auth
- Yahoo Finance for quoted market data
- fallback pricing provider for gaps
- FX provider for conversion rates
- Google Drive API for backup export sync

## Core Architectural Decisions

### Ledger-First Model

The app must never treat positions as the primary source of truth. Positions are derived from operations, which prevents drift and makes CSV imports, recalculation, and future reporting much safer.

### Snapshot Pricing

Store only the latest usable market price and latest FX rate. Historical market analytics are out of scope for v1, which keeps storage and data refresh logic simple.

### Manual Instrument Fallback

If an instrument cannot be resolved through external sources, support a manual instrument path immediately instead of blocking user entry.

### Single-User with Future Upgrade Path

Implement authentication and row ownership now, but keep authorization simple. Every record belongs to the owner account. This is enough for v1 and keeps the path to multi-user open.

## Main Modules

### Auth Module

- Google sign-in
- owner access restriction
- session handling

### Portfolio Module

- CRUD for portfolios
- summaries by portfolio

### Instrument Module

- create manual instrument
- resolve quoted instruments
- manage ambiguity by exchange selection
- instrument search cache

### Operations Module

- add, edit, delete operation
- validate operation invariants
- CSV import mapping and validation

### Calculation Module

- net position computation
- average cost basis
- current valuation
- P&L metrics at position, portfolio, and consolidated level
- cash balances from DEPOSIT and WITHDRAW

### Pricing Module

- fetch latest market prices
- fetch latest FX rates
- reconcile price source metadata
- throttle refreshes to stay within provider limits

### Backup Module

- daily CSV export generation
- upload to Google Drive
- export status tracking

## Key Flows

### Manual Operation Entry

1. User selects portfolio.
2. User chooses operation type.
3. User resolves or creates the instrument if needed.
4. User enters quantity, price, fees, currency, and date.
5. Server validates the operation.
6. Operation is stored.
7. Dashboard queries reflect the updated derived position.

### CSV Import

1. User uploads CSV.
2. Server validates schema and row-level data.
3. Instruments are matched or created.
4. Valid rows are inserted as operations inside a transaction boundary per import unit.
5. Errors are recorded and shown back to the user.

### Price Refresh

1. User opens dashboard or requests refresh.
2. Server identifies quoted instruments in view.
3. Latest prices are fetched.
4. FX rates are fetched for needed currencies.
5. Latest snapshot tables are updated.
6. Read models compute fresh valuations in the selected base currency.

### Google Drive Backup

1. Scheduled job generates CSV exports for operations and optionally positions.
2. Files are temporarily stored.
3. Google Drive upload runs with the user's granted access.
4. Export status is recorded.

## API Surface

Suggested internal endpoints or server actions:

- `POST /api/portfolios`
- `PATCH /api/portfolios/:id`
- `DELETE /api/portfolios/:id`
- `POST /api/instruments/resolve`
- `POST /api/operations`
- `PATCH /api/operations/:id`
- `DELETE /api/operations/:id`
- `POST /api/imports/csv`
- `GET /api/dashboard/summary`
- `POST /api/prices/refresh`
- `POST /api/backups/export`

## Security Model

- Google SSO only.
- All application data scoped to the authenticated owner.
- Enforce row ownership checks server-side and with database policies if using Supabase RLS.
- Encrypt secrets through Vercel and Supabase environment management.

## Deployment Shape

### Vercel

- Hosts the Next.js application.
- Handles route handlers, server actions, and optional scheduled tasks.

### Supabase

- Hosts Postgres.
- Handles auth and OAuth provider configuration.
- Stores generated assets or import files when needed.

## Cost Notes

- Vercel and Supabase both have free tiers suitable for initial MVP development.
- Pricing and FX providers may force paid usage if refresh frequency grows.
- Google Drive backup integration is cheap operationally, but requires OAuth setup and some implementation care.

## Recommended Build Order

1. Project scaffold, auth, and database schema
2. Portfolio CRUD and protected app shell
3. Instrument model and manual operation entry
4. Position calculation engine and dashboard summaries
5. Pricing and FX refresh
6. CSV import and export
7. Charts and mobile UX polish
8. Google Drive automatic backup

## What Can Wait Until v2

- Broker-specific CSV adapters
- richer analytics
- dividends and income events
- benchmark comparisons
- multi-user support
- historical price charts based on stored time series
