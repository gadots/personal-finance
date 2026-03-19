# Portfolio Manager Data Model v1

## Design Principles

- Store immutable operations as the source of truth.
- Derive positions and aggregated metrics from operations.
- Keep the schema single-user ready, but include `owner_user_id` so multi-user migration remains straightforward.
- Separate instrument identity from pricing.

## Main Entities

### users

Represents the authenticated owner account.

Fields:

- id `uuid` primary key
- email `text` unique not null
- full_name `text`
- avatar_url `text`
- created_at `timestamptz`
- updated_at `timestamptz`

### portfolios

Each portfolio represents a broker, bank, wallet, or account container.

Fields:

- id `uuid` primary key
- owner_user_id `uuid` not null references users(id)
- name `text` not null
- base_label `text` optional
- created_at `timestamptz`
- updated_at `timestamptz`

Constraints:

- unique `(owner_user_id, name)`

### asset_types

Fixed catalog table or database enum.

Allowed values:

- STOCK
- ETF
- MUTUAL_FUND
- BOND
- CRYPTO
- CASH
- PRIVATE_ASSET
- OTHER

### instruments

Canonical asset registry.

Fields:

- id `uuid` primary key
- owner_user_id `uuid` not null references users(id)
- asset_type `text` not null
- name `text` not null
- symbol `text`
- isin `text`
- exchange_code `text`
- currency_code `text` not null
- pricing_mode `text` not null
- pricing_source `text`
- external_source_key `text`
- is_active `boolean` default true
- created_at `timestamptz`
- updated_at `timestamptz`

Recommended enums:

- `pricing_mode`: `MARKET`, `MANUAL`
- `pricing_source`: `YAHOO_FINANCE`, `FALLBACK_PROVIDER`, `MANUAL`

Constraints:

- at least one of `isin`, `symbol`, or manual identity must exist
- unique `(owner_user_id, isin)` where isin is not null
- optional unique `(owner_user_id, symbol, exchange_code, currency_code)` for quoted instruments

### manual_valuations

Stores the latest manual valuation history for non-quoted assets.

Fields:

- id `uuid` primary key
- owner_user_id `uuid` not null references users(id)
- instrument_id `uuid` not null references instruments(id)
- valuation_amount `numeric(20,8)` not null
- currency_code `text` not null
- effective_at `date` not null
- notes `text`
- created_at `timestamptz`

Rule:

- Latest record by `effective_at` is the active manual valuation.

### operations

Ledger of all financial events.

Fields:

- id `uuid` primary key
- owner_user_id `uuid` not null references users(id)
- portfolio_id `uuid` not null references portfolios(id)
- instrument_id `uuid` references instruments(id)
- operation_type `text` not null
- quantity `numeric(20,8)`
- unit_price `numeric(20,8)`
- gross_amount `numeric(20,8)`
- fee_amount `numeric(20,8)` default 0
- currency_code `text` not null
- executed_at `date` not null
- notes `text`
- import_batch_id `uuid`
- created_at `timestamptz`
- updated_at `timestamptz`

Allowed `operation_type` values:

- BUY
- SELL
- DEPOSIT
- WITHDRAW

Rules:

- `instrument_id`, `quantity`, and `unit_price` are required for BUY and SELL.
- `gross_amount` is required for DEPOSIT and WITHDRAW.
- `quantity` must be positive.
- `unit_price` must be positive when present.
- `fee_amount` must be zero or positive.

### price_snapshots

Stores only the latest known market price per instrument, updated in place or as append-only with a latest selector.

Fields:

- instrument_id `uuid` primary key references instruments(id)
- source `text` not null
- price `numeric(20,8)` not null
- currency_code `text` not null
- as_of `timestamptz` not null
- raw_payload `jsonb`
- updated_at `timestamptz`

### fx_rates

Stores latest conversion rates into supported currencies.

Fields:

- base_currency_code `text` not null
- quote_currency_code `text` not null
- rate `numeric(20,8)` not null
- source `text` not null
- as_of `timestamptz` not null
- updated_at `timestamptz`

Constraints:

- primary key `(base_currency_code, quote_currency_code)`

### csv_import_batches

Tracks CSV imports and validation results.

Fields:

- id `uuid` primary key
- owner_user_id `uuid` not null references users(id)
- filename `text` not null
- status `text` not null
- total_rows `integer` default 0
- imported_rows `integer` default 0
- failed_rows `integer` default 0
- created_at `timestamptz`

Allowed `status` values:

- PENDING
- PROCESSED
- FAILED

### csv_import_errors

Fields:

- id `uuid` primary key
- batch_id `uuid` not null references csv_import_batches(id)
- row_number `integer` not null
- message `text` not null
- created_at `timestamptz`

### backup_exports

Tracks generated CSV backups and Google Drive sync state.

Fields:

- id `uuid` primary key
- owner_user_id `uuid` not null references users(id)
- export_type `text` not null
- storage_path `text`
- google_drive_file_id `text`
- status `text` not null
- generated_at `timestamptz` not null
- created_at `timestamptz`

Allowed `status` values:

- PENDING
- EXPORTED
- FAILED

## Derived Read Models

These can be materialized views, SQL views, or server-side computed query models.

### position_lots_summary

Per `owner_user_id + portfolio_id + instrument_id`:

- net_quantity
- average_cost
- total_cost_basis
- last_buy_at
- last_sell_at

### position_valuation_summary

Per `owner_user_id + portfolio_id + instrument_id`:

- market_price
- market_price_currency
- converted_market_price
- current_value_base
- cost_basis_base
- unrealized_pnl_base
- unrealized_pnl_percent

### portfolio_summary

Per `owner_user_id + portfolio_id`:

- total_value_base
- total_cost_basis_base
- unrealized_pnl_base
- cash_balance_by_currency

### consolidated_summary

Per `owner_user_id`:

- total_value_base
- total_cost_basis_base
- total_unrealized_pnl_base
- value_by_asset_type
- value_by_portfolio

## CSV Format v1

Use one strict app-defined CSV schema:

Columns:

- operation_type
- portfolio_name
- asset_type
- instrument_name
- symbol
- isin
- exchange_code
- quantity
- unit_price
- gross_amount
- fee_amount
- currency_code
- executed_at
- notes

Notes:

- `executed_at` format: `DD/MM/YYYY`
- BUY and SELL require `quantity` and `unit_price`
- DEPOSIT and WITHDRAW require `gross_amount`
- Empty identifier fields are allowed for manual instruments, but `instrument_name` and `asset_type` remain required

## Multi-User Migration Path

The model is single-user in practice, but migration is straightforward because each core entity already carries `owner_user_id`. To support shared workspaces later, replace or extend `owner_user_id` with `workspace_id`, then add memberships, roles, and row-level security policies by workspace.
