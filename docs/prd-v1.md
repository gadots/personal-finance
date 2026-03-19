# Portfolio Manager PRD v1

## Product Summary

Portfolio Manager is a personal, mobile-first web app for tracking investments across multiple portfolios, where each portfolio represents a broker, bank, wallet, or any investment container defined by the user.

The product allows manual and CSV-based operation imports, computes current positions from those operations, updates valuations using external market data when available, supports manual valuation for non-quoted assets, and presents a unified consolidated view across all portfolios.

## Goals

- Track holdings across multiple portfolios in one place.
- Support quoted and non-quoted assets.
- Use an operation ledger as the source of truth.
- Provide consolidated valuation and P&L in a selected base currency.
- Work well on mobile first, with responsive desktop support.
- Keep infrastructure simple and low-cost.

## Non-Goals for v1

- Direct broker integrations.
- Multi-user collaboration.
- Dividends, coupons, and interest flows.
- Benchmark comparison.
- Historical price storage.
- Audit trail by actor/role.
- Email/password authentication.

## Target User

Single owner. The app is personal and optimized for one authenticated Google account.

## Core Concepts

- Portfolio: a named container representing a broker, bank, wallet, or account.
- Instrument: a financial asset, identified by ISIN when available, otherwise by ticker plus exchange plus currency, or as a manual instrument.
- Operation: a ledger entry such as BUY, SELL, DEPOSIT, or WITHDRAW.
- Position: a derived current holding per portfolio and instrument, computed from operations.
- Valuation: latest known market price or manually entered valuation for non-quoted assets.

## Functional Requirements

### Authentication

- Sign in with Google SSO only.
- Restrict access to the single owner account.

### Portfolio Management

- Create, edit, and delete portfolios.
- Portfolio name is free text.
- Optional metadata such as institution type or notes can be added later, but is not required in v1.

### Asset Types

Use a fixed catalog, no free-text asset type:

- Stock
- ETF
- Mutual Fund
- Bond
- Crypto
- Cash
- Private Asset
- Other

### Instrument Management

- Create or resolve instruments during operation entry.
- Support quoted and non-quoted instruments.
- Required fields vary by instrument type, but the canonical model should support:
  - name
  - asset type
  - ticker or symbol
  - ISIN or equivalent identifier
  - exchange
  - trading currency
  - pricing source or manual mode

### Operation Ledger

Supported operation types in v1:

- BUY
- SELL
- DEPOSIT
- WITHDRAW

Operation fields:

- portfolio
- instrument when applicable
- operation type
- quantity when applicable
- unit price when applicable
- operation currency
- fees
- execution date
- notes optional

Rules:

- Positions are derived from BUY and SELL operations.
- Partial closes must recalculate remaining cost basis using average cost.
- DEPOSIT and WITHDRAW must affect cash balance views and net contribution metrics.
- Invalid sells that exceed available quantity should be blocked.

### Position Calculation

- Compute net quantity per portfolio and instrument from operations.
- Compute average cost basis.
- Compute invested amount, current value, unrealized P&L absolute, unrealized P&L percentage.
- Show metrics at position, portfolio, and consolidated level.

### Market Data

- Yahoo Finance is the primary source for quoted instruments.
- Fallback providers can be added for missing instruments or FX rates.
- Latest price only is stored or cached for valuation purposes.
- No historical pricing storage in v1.
- Target refresh behavior: on app open, manual refresh, and periodic refresh around every minute when possible within provider limits.

### FX Conversion

- Base currency can be selected from USD, EUR, or ARS.
- FX conversion is automatic using a standard provider.
- Metrics should be viewable consistently in the selected base currency.

### Non-Quoted Assets

- Support manual valuation entry.
- Manual valuation includes amount, currency, and effective date.
- No external price lookup is required.

### CSV Import and Export

- Support manual operation entry and CSV import from day one.
- Use a simple product-defined CSV format for v1.
- Import must validate required fields and report row-level errors.
- Export must support current operations and current positions.
- Daily automatic backup export to Google Drive is desired in v1 if implementation remains manageable; otherwise it becomes the first post-v1 item after the core product is stable.

### Consolidated Views

Primary views:

- total summary
- by portfolio
- by asset type
- position detail
- operation history

Filters:

- portfolio
- asset type
- date range

### Charts

Include charts in v1:

- allocation by portfolio
- allocation by asset type
- total current value overview

## UX Requirements

- Mobile-first design.
- Fast add operation flow optimized for phone usage.
- Clear distinction between quoted and manual instruments.
- Responsive dashboard for desktop and tablet.
- Interface language in English.
- Date format day/month/year.

## Quality Requirements

- Strong type safety and input validation.
- Clear error states for market data lookup failures and CSV import issues.
- Idempotent operation processing.
- Reliable derived metrics from the ledger, not from mutable position records.

## Risks and Mitigations

- Market data ambiguity: require exchange selection when ticker is ambiguous.
- Provider gaps: support manual instrument mode and manual valuation fallback.
- CSV diversity: start with one strict app-defined format to reduce ambiguity.
- Backup scope: treat automatic Google Drive export as a separate integration boundary.

## Suggested Delivery Phases

### Phase 1

- Authentication
- Portfolio CRUD
- Instrument creation and resolution
- Manual operation entry
- Position engine
- Consolidated dashboard

### Phase 2

- CSV import and export
- Market data refresh jobs
- FX conversion hardening
- Charts

### Phase 3

- Google Drive automatic backups
- Provider fallback improvements
- Non-quoted asset valuation polish
