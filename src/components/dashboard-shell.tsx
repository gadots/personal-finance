"use client";

import { useState } from "react";
import { z } from "zod";
import {
  assetTypes,
  baseCurrencies,
  operationTypes,
  sampleOperations,
  samplePortfolios,
  type AssetType,
  type BaseCurrency,
  type Operation,
  type OperationType,
  type Portfolio,
} from "@/lib/domain";
import { buildDashboardSummary } from "@/lib/portfolio-engine";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const portfolioSchema = z.object({
  name: z.string().min(2).max(40),
  institutionLabel: z.string().min(2).max(24),
});

const operationSchema = z
  .object({
    portfolioId: z.string().min(1),
    type: z.enum(operationTypes),
    assetType: z.enum(assetTypes).optional(),
    instrumentName: z.string().optional(),
    symbol: z.string().optional(),
    quantity: z.number().optional(),
    unitPrice: z.number().optional(),
    grossAmount: z.number().optional(),
    feeAmount: z.number().min(0),
    currencyCode: z.string().min(3).max(5),
    executedAt: z.string().min(1),
    notes: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.type === "BUY" || value.type === "SELL") {
      if (!value.assetType) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["assetType"],
          message: "Asset type is required for BUY and SELL.",
        });
      }

      if (!value.instrumentName) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["instrumentName"],
          message: "Instrument name is required for BUY and SELL.",
        });
      }

      if (!value.quantity || value.quantity <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Quantity must be greater than zero.",
        });
      }

      if (!value.unitPrice || value.unitPrice <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unitPrice"],
          message: "Unit price must be greater than zero.",
        });
      }
    }

    if ((value.type === "DEPOSIT" || value.type === "WITHDRAW") && (!value.grossAmount || value.grossAmount <= 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["grossAmount"],
        message: "Amount must be greater than zero.",
      });
    }
  });

const emptyOperationForm = {
  portfolioId: samplePortfolios[0]?.id ?? "",
  type: "BUY" as OperationType,
  assetType: "STOCK" as AssetType,
  instrumentName: "",
  symbol: "",
  quantity: 0,
  unitPrice: 0,
  grossAmount: 0,
  feeAmount: 0,
  currencyCode: "USD",
  executedAt: "2026-03-19",
  notes: "",
};

export function DashboardShell() {
  const [selectedCurrency, setSelectedCurrency] = useState<BaseCurrency>("USD");
  const [portfolios, setPortfolios] = useState<Portfolio[]>(samplePortfolios);
  const [operations, setOperations] = useState<Operation[]>(sampleOperations);
  const [portfolioForm, setPortfolioForm] = useState({
    name: "",
    institutionLabel: "",
  });
  const [operationForm, setOperationForm] = useState(emptyOperationForm);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  const summary = buildDashboardSummary(portfolios, operations, selectedCurrency);
  const filteredHistory = [...operations].sort((left, right) =>
    right.executedAt.localeCompare(left.executedAt),
  );

  function handleCreatePortfolio() {
    const parsed = portfolioSchema.safeParse(portfolioForm);

    if (!parsed.success) {
      setPortfolioError(parsed.error.issues[0]?.message ?? "Portfolio is invalid.");
      return;
    }

    const newPortfolio: Portfolio = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      institutionLabel: parsed.data.institutionLabel,
    };

    setPortfolios((current) => [...current, newPortfolio]);
    setPortfolioForm({ name: "", institutionLabel: "" });
    setPortfolioError(null);
    setOperationForm((current) => ({ ...current, portfolioId: newPortfolio.id }));
  }

  function handleCreateOperation() {
    const payload = {
      ...operationForm,
      quantity:
        operationForm.quantity && Number.isFinite(operationForm.quantity)
          ? operationForm.quantity
          : undefined,
      unitPrice:
        operationForm.unitPrice && Number.isFinite(operationForm.unitPrice)
          ? operationForm.unitPrice
          : undefined,
      grossAmount:
        operationForm.grossAmount && Number.isFinite(operationForm.grossAmount)
          ? operationForm.grossAmount
          : undefined,
      instrumentName: operationForm.instrumentName || undefined,
      symbol: operationForm.symbol || undefined,
      notes: operationForm.notes || undefined,
    };

    const parsed = operationSchema.safeParse(payload);

    if (!parsed.success) {
      setOperationError(parsed.error.issues[0]?.message ?? "Operation is invalid.");
      return;
    }

    const newOperation: Operation = {
      id: crypto.randomUUID(),
      ...parsed.data,
    };

    setOperations((current) => [newOperation, ...current]);
    setOperationError(null);
    setOperationForm({
      ...emptyOperationForm,
      portfolioId: parsed.data.portfolioId,
      type: parsed.data.type,
      currencyCode: parsed.data.currencyCode,
    });
  }

  return (
    <main className="grain min-h-screen overflow-hidden">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-[var(--color-line)] bg-[rgba(255,250,241,0.04)] p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(138,227,192,0.3)] bg-[rgba(138,227,192,0.1)] px-4 py-2 text-[0.7rem] uppercase tracking-[0.26em] text-[var(--color-mint)]">
              Portfolio Manager foundation
            </div>
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[var(--color-paper-strong)] sm:text-5xl">
                First working slice: portfolios, operations, and consolidated positions.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(246,241,232,0.7)] sm:text-base">
                The UI below already behaves like the future product, but it is
                currently backed by local state while Supabase and Google auth are
                being wired.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-[1.5rem] border border-[var(--color-line)] p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(246,241,232,0.48)]">
                Data mode
              </p>
              <p className="mt-3 text-lg font-semibold">
                {hasSupabaseConfig ? "Supabase ready" : "Local demo"}
              </p>
            </div>
            <label className="rounded-[1.5rem] border border-[var(--color-line)] p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(246,241,232,0.48)]">
                Base currency
              </p>
              <select
                value={selectedCurrency}
                onChange={(event) =>
                  setSelectedCurrency(event.target.value as BaseCurrency)
                }
                className="mt-3 w-full bg-transparent text-lg font-semibold outline-none"
              >
                {baseCurrencies.map((currency) => (
                  <option key={currency} value={currency} className="bg-[var(--color-ink)]">
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {!hasSupabaseConfig ? (
          <section className="rounded-[1.75rem] border border-[rgba(244,125,100,0.32)] bg-[rgba(244,125,100,0.08)] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(244,125,100,0.82)]">
              Supabase still not connected
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgba(246,241,232,0.74)]">
              Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
              `OWNER_EMAIL` in `.env.local`, then run the migration in
              `supabase/migrations`. After that, we can swap this screen from demo
              state to live persistence without redesigning it.
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total value",
              value: formatCurrency(summary.totalValueBase, selectedCurrency),
              tone: "text-[var(--color-paper-strong)]",
            },
            {
              label: "Invested",
              value: formatCurrency(summary.totalInvestedBase, selectedCurrency),
              tone: "text-[rgba(246,241,232,0.84)]",
            },
            {
              label: "Cash balance",
              value: formatCurrency(summary.totalCashBase, selectedCurrency),
              tone: "text-[rgba(216,185,139,0.96)]",
            },
            {
              label: "Unrealized P&L",
              value: formatCurrency(summary.totalUnrealizedPnlBase, selectedCurrency),
              tone:
                summary.totalUnrealizedPnlBase >= 0
                  ? "text-[var(--color-mint)]"
                  : "text-[var(--color-coral)]",
            },
          ].map((card) => (
            <article key={card.label} className="card-sheen rounded-[1.75rem] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(246,241,232,0.48)]">
                {card.label}
              </p>
              <p className={`mt-4 text-3xl font-semibold tracking-[-0.05em] ${card.tone}`}>
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="card-sheen rounded-[2rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(246,241,232,0.48)]">
                    Portfolios
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper-strong)]">
                    Containers and balances
                  </h2>
                </div>
                <p className="font-mono text-sm text-[rgba(246,241,232,0.6)]">
                  {portfolios.length} active
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {summary.portfolios.map((portfolio) => (
                  <article
                    key={portfolio.portfolioId}
                    className="rounded-[1.5rem] border border-[var(--color-line)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[var(--color-paper-strong)]">
                          {portfolio.name}
                        </p>
                        <p className="text-sm text-[rgba(246,241,232,0.58)]">
                          {portfolio.institutionLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[rgba(246,241,232,0.48)]">Total value</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(portfolio.totalValueBase, selectedCurrency)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-[rgba(246,241,232,0.46)]">Positions</p>
                        <p className="mt-1 font-medium">{portfolio.positionsCount}</p>
                      </div>
                      <div>
                        <p className="text-[rgba(246,241,232,0.46)]">Cash</p>
                        <p className="mt-1 font-medium">
                          {formatCurrency(portfolio.cashBalanceBase, selectedCurrency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[rgba(246,241,232,0.46)]">P&amp;L</p>
                        <p
                          className={`mt-1 font-medium ${
                            portfolio.unrealizedPnlBase >= 0
                              ? "text-[var(--color-mint)]"
                              : "text-[var(--color-coral)]"
                          }`}
                        >
                          {formatCurrency(portfolio.unrealizedPnlBase, selectedCurrency)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="card-sheen rounded-[2rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(246,241,232,0.48)]">
                    Position detail
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper-strong)]">
                    Open holdings
                  </h2>
                </div>
                <p className="font-mono text-sm text-[rgba(246,241,232,0.6)]">
                  {summary.positions.length} open
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {summary.positions.map((position) => (
                  <article
                    key={`${position.portfolioId}:${position.symbolKey}`}
                    className="rounded-[1.5rem] border border-[var(--color-line)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[var(--color-paper-strong)]">
                          {position.instrumentName}
                        </p>
                        <p className="text-sm text-[rgba(246,241,232,0.58)]">
                          {position.assetType} · {position.symbolKey}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[rgba(246,241,232,0.48)]">Current value</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(position.marketValueBase, selectedCurrency)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-[rgba(246,241,232,0.46)]">Quantity</p>
                        <p className="mt-1 font-medium">{position.quantity.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-[rgba(246,241,232,0.46)]">Avg cost</p>
                        <p className="mt-1 font-medium">{position.averageCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[rgba(246,241,232,0.46)]">Current price</p>
                        <p className="mt-1 font-medium">{position.currentPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[rgba(246,241,232,0.46)]">P&amp;L</p>
                        <p
                          className={`mt-1 font-medium ${
                            position.unrealizedPnlBase >= 0
                              ? "text-[var(--color-mint)]"
                              : "text-[var(--color-coral)]"
                          }`}
                        >
                          {formatPercent(position.unrealizedPnlPercent)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="card-sheen rounded-[2rem] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(246,241,232,0.48)]">
                Create portfolio
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper-strong)]">
                Add a new container
              </h2>

              <div className="mt-5 space-y-3">
                <input
                  value={portfolioForm.name}
                  onChange={(event) =>
                    setPortfolioForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Portfolio name"
                  className="w-full rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                />
                <input
                  value={portfolioForm.institutionLabel}
                  onChange={(event) =>
                    setPortfolioForm((current) => ({
                      ...current,
                      institutionLabel: event.target.value,
                    }))
                  }
                  placeholder="Broker, Bank, Wallet..."
                  className="w-full rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                />
                {portfolioError ? (
                  <p className="text-sm text-[var(--color-coral)]">{portfolioError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleCreatePortfolio}
                  className="w-full rounded-full bg-[var(--color-paper-strong)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]"
                >
                  Add portfolio
                </button>
              </div>
            </section>

            <section className="card-sheen rounded-[2rem] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(246,241,232,0.48)]">
                Record operation
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper-strong)]">
                Ledger entry form
              </h2>

              <div className="mt-5 grid gap-3">
                <select
                  value={operationForm.portfolioId}
                  onChange={(event) =>
                    setOperationForm((current) => ({
                      ...current,
                      portfolioId: event.target.value,
                    }))
                  }
                  className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none"
                >
                  {portfolios.map((portfolio) => (
                    <option
                      key={portfolio.id}
                      value={portfolio.id}
                      className="bg-[var(--color-ink)]"
                    >
                      {portfolio.name}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={operationForm.type}
                    onChange={(event) =>
                      setOperationForm((current) => ({
                        ...current,
                        type: event.target.value as OperationType,
                      }))
                    }
                    className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none"
                  >
                    {operationTypes.map((type) => (
                      <option key={type} value={type} className="bg-[var(--color-ink)]">
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    value={operationForm.currencyCode}
                    onChange={(event) =>
                      setOperationForm((current) => ({
                        ...current,
                        currencyCode: event.target.value,
                      }))
                    }
                    className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none"
                  >
                    {["USD", "EUR", "ARS", "USDT"].map((currency) => (
                      <option
                        key={currency}
                        value={currency}
                        className="bg-[var(--color-ink)]"
                      >
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                {operationForm.type === "BUY" || operationForm.type === "SELL" ? (
                  <>
                    <select
                      value={operationForm.assetType}
                      onChange={(event) =>
                        setOperationForm((current) => ({
                          ...current,
                          assetType: event.target.value as AssetType,
                        }))
                      }
                      className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none"
                    >
                      {assetTypes.map((type) => (
                        <option key={type} value={type} className="bg-[var(--color-ink)]">
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      value={operationForm.instrumentName}
                      onChange={(event) =>
                        setOperationForm((current) => ({
                          ...current,
                          instrumentName: event.target.value,
                        }))
                      }
                      placeholder="Instrument name"
                      className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                    />
                    <input
                      value={operationForm.symbol}
                      onChange={(event) =>
                        setOperationForm((current) => ({
                          ...current,
                          symbol: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ticker / symbol"
                      className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="0.0001"
                        value={operationForm.quantity || ""}
                        onChange={(event) =>
                          setOperationForm((current) => ({
                            ...current,
                            quantity: Number(event.target.value),
                          }))
                        }
                        placeholder="Quantity"
                        className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={operationForm.unitPrice || ""}
                        onChange={(event) =>
                          setOperationForm((current) => ({
                            ...current,
                            unitPrice: Number(event.target.value),
                          }))
                        }
                        placeholder="Unit price"
                        className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                      />
                    </div>
                  </>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    value={operationForm.grossAmount || ""}
                    onChange={(event) =>
                      setOperationForm((current) => ({
                        ...current,
                        grossAmount: Number(event.target.value),
                      }))
                    }
                    placeholder="Amount"
                    className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={operationForm.feeAmount || ""}
                    onChange={(event) =>
                      setOperationForm((current) => ({
                        ...current,
                        feeAmount: Number(event.target.value),
                      }))
                    }
                    placeholder="Fees"
                    className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                  />
                  <input
                    type="date"
                    value={operationForm.executedAt}
                    onChange={(event) =>
                      setOperationForm((current) => ({
                        ...current,
                        executedAt: event.target.value,
                      }))
                    }
                    className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none"
                  />
                </div>

                <textarea
                  value={operationForm.notes}
                  onChange={(event) =>
                    setOperationForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Optional note"
                  rows={3}
                  className="rounded-[1.2rem] border border-[var(--color-line)] bg-transparent px-4 py-3 outline-none placeholder:text-[rgba(246,241,232,0.36)]"
                />

                {operationError ? (
                  <p className="text-sm text-[var(--color-coral)]">{operationError}</p>
                ) : null}

                <button
                  type="button"
                  onClick={handleCreateOperation}
                  className="w-full rounded-full bg-[var(--color-mint)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]"
                >
                  Save operation
                </button>
              </div>
            </section>

            <section className="card-sheen rounded-[2rem] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[rgba(246,241,232,0.48)]">
                Operation history
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-paper-strong)]">
                Recent ledger entries
              </h2>

              <div className="mt-5 space-y-3">
                {filteredHistory.slice(0, 8).map((operation) => (
                  <article
                    key={operation.id}
                    className="rounded-[1.5rem] border border-[var(--color-line)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-paper-strong)]">
                          {operation.type}
                          {operation.instrumentName ? ` · ${operation.instrumentName}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-[rgba(246,241,232,0.58)]">
                          {portfolios.find((portfolio) => portfolio.id === operation.portfolioId)?.name}
                        </p>
                      </div>
                      <p className="font-mono text-xs text-[rgba(246,241,232,0.52)]">
                        {formatDate(operation.executedAt)}
                      </p>
                    </div>

                    <p className="mt-3 text-sm text-[rgba(246,241,232,0.72)]">
                      {operation.type === "BUY" || operation.type === "SELL"
                        ? `${operation.quantity?.toFixed(4)} @ ${operation.unitPrice?.toFixed(2)} ${operation.currencyCode}`
                        : `${operation.grossAmount?.toFixed(2)} ${operation.currencyCode}`}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
