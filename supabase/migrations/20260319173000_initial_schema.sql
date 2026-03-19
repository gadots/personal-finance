create extension if not exists "pgcrypto";

create type asset_type as enum (
  'STOCK',
  'ETF',
  'MUTUAL_FUND',
  'BOND',
  'CRYPTO',
  'CASH',
  'PRIVATE_ASSET',
  'OTHER'
);

create type pricing_mode as enum (
  'MARKET',
  'MANUAL'
);

create type pricing_source as enum (
  'YAHOO_FINANCE',
  'FALLBACK_PROVIDER',
  'MANUAL'
);

create type operation_type as enum (
  'BUY',
  'SELL',
  'DEPOSIT',
  'WITHDRAW'
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  base_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, name)
);

create table if not exists public.instruments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  asset_type asset_type not null,
  name text not null,
  symbol text,
  isin text,
  exchange_code text,
  currency_code text not null,
  pricing_mode pricing_mode not null default 'MARKET',
  pricing_source pricing_source,
  external_source_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instrument_identifier_check check (
    isin is not null
    or symbol is not null
    or pricing_mode = 'MANUAL'
  )
);

create unique index if not exists instruments_owner_isin_idx
  on public.instruments (owner_user_id, isin)
  where isin is not null;

create unique index if not exists instruments_owner_symbol_exchange_currency_idx
  on public.instruments (owner_user_id, symbol, exchange_code, currency_code)
  where symbol is not null and exchange_code is not null;

create table if not exists public.manual_valuations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  valuation_amount numeric(20,8) not null,
  currency_code text not null,
  effective_at date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.csv_import_batches (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  filename text not null,
  status text not null check (status in ('PENDING', 'PROCESSED', 'FAILED')),
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  failed_rows integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.operations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  instrument_id uuid references public.instruments(id) on delete set null,
  operation_type operation_type not null,
  quantity numeric(20,8),
  unit_price numeric(20,8),
  gross_amount numeric(20,8),
  fee_amount numeric(20,8) not null default 0,
  currency_code text not null,
  executed_at date not null,
  notes text,
  import_batch_id uuid references public.csv_import_batches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operation_payload_check check (
    (
      operation_type in ('BUY', 'SELL')
      and instrument_id is not null
      and quantity is not null
      and unit_price is not null
    )
    or (
      operation_type in ('DEPOSIT', 'WITHDRAW')
      and gross_amount is not null
    )
  ),
  constraint operation_positive_quantity_check check (
    quantity is null or quantity > 0
  ),
  constraint operation_positive_unit_price_check check (
    unit_price is null or unit_price > 0
  ),
  constraint operation_nonnegative_fee_check check (
    fee_amount >= 0
  )
);

create table if not exists public.csv_import_errors (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.csv_import_batches(id) on delete cascade,
  row_number integer not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.price_snapshots (
  instrument_id uuid primary key references public.instruments(id) on delete cascade,
  source pricing_source not null,
  price numeric(20,8) not null,
  currency_code text not null,
  as_of timestamptz not null,
  raw_payload jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.fx_rates (
  base_currency_code text not null,
  quote_currency_code text not null,
  rate numeric(20,8) not null,
  source text not null,
  as_of timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (base_currency_code, quote_currency_code)
);

create table if not exists public.backup_exports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  export_type text not null,
  storage_path text,
  google_drive_file_id text,
  status text not null check (status in ('PENDING', 'EXPORTED', 'FAILED')),
  generated_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.portfolios enable row level security;
alter table public.instruments enable row level security;
alter table public.manual_valuations enable row level security;
alter table public.csv_import_batches enable row level security;
alter table public.operations enable row level security;
alter table public.csv_import_errors enable row level security;
alter table public.price_snapshots enable row level security;
alter table public.fx_rates enable row level security;
alter table public.backup_exports enable row level security;

create or replace function public.is_owner(record_owner_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = record_owner_user_id
      and u.auth_user_id = auth.uid()
  );
$$;

create policy "users_select_own"
  on public.users
  for select
  using (auth_user_id = auth.uid());

create policy "users_insert_own"
  on public.users
  for insert
  with check (auth_user_id = auth.uid());

create policy "users_update_own"
  on public.users
  for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "portfolios_owner_all"
  on public.portfolios
  for all
  using (public.is_owner(owner_user_id))
  with check (public.is_owner(owner_user_id));

create policy "instruments_owner_all"
  on public.instruments
  for all
  using (public.is_owner(owner_user_id))
  with check (public.is_owner(owner_user_id));

create policy "manual_valuations_owner_all"
  on public.manual_valuations
  for all
  using (public.is_owner(owner_user_id))
  with check (public.is_owner(owner_user_id));

create policy "csv_import_batches_owner_all"
  on public.csv_import_batches
  for all
  using (public.is_owner(owner_user_id))
  with check (public.is_owner(owner_user_id));

create policy "operations_owner_all"
  on public.operations
  for all
  using (public.is_owner(owner_user_id))
  with check (public.is_owner(owner_user_id));

create policy "backup_exports_owner_all"
  on public.backup_exports
  for all
  using (public.is_owner(owner_user_id))
  with check (public.is_owner(owner_user_id));

create policy "csv_import_errors_via_batch"
  on public.csv_import_errors
  for select
  using (
    exists (
      select 1
      from public.csv_import_batches b
      where b.id = batch_id
        and public.is_owner(b.owner_user_id)
    )
  );

create policy "price_snapshots_via_instrument"
  on public.price_snapshots
  for select
  using (
    exists (
      select 1
      from public.instruments i
      where i.id = instrument_id
        and public.is_owner(i.owner_user_id)
    )
  );

create policy "price_snapshots_via_instrument_write"
  on public.price_snapshots
  for insert
  with check (
    exists (
      select 1
      from public.instruments i
      where i.id = instrument_id
        and public.is_owner(i.owner_user_id)
    )
  );

create policy "price_snapshots_via_instrument_update"
  on public.price_snapshots
  for update
  using (
    exists (
      select 1
      from public.instruments i
      where i.id = instrument_id
        and public.is_owner(i.owner_user_id)
    )
  )
  with check (
    exists (
      select 1
      from public.instruments i
      where i.id = instrument_id
        and public.is_owner(i.owner_user_id)
    )
  );

create policy "fx_rates_read_authenticated"
  on public.fx_rates
  for select
  using (auth.role() = 'authenticated');
