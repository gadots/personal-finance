import type { BaseCurrency, Operation, Portfolio } from "@/lib/domain";
import { exchangeRates, marketPrices } from "@/lib/domain";

type PositionAccumulator = {
  portfolioId: string;
  symbolKey: string;
  assetType: string;
  instrumentName: string;
  currencyCode: string;
  quantity: number;
  totalCost: number;
};

export type PositionSnapshot = {
  portfolioId: string;
  instrumentName: string;
  symbolKey: string;
  assetType: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValueBase: number;
  costBasisBase: number;
  unrealizedPnlBase: number;
  unrealizedPnlPercent: number;
};

export type PortfolioSummary = {
  portfolioId: string;
  name: string;
  institutionLabel: string;
  positionsCount: number;
  cashBalanceBase: number;
  investedBase: number;
  marketValueBase: number;
  totalValueBase: number;
  unrealizedPnlBase: number;
};

export type DashboardSummary = {
  positions: PositionSnapshot[];
  portfolios: PortfolioSummary[];
  totalValueBase: number;
  totalInvestedBase: number;
  totalCashBase: number;
  totalUnrealizedPnlBase: number;
};

function convertAmount(
  amount: number,
  sourceCurrency: string,
  baseCurrency: BaseCurrency,
) {
  const rate = exchangeRates[baseCurrency][sourceCurrency] ?? 1;
  return amount * rate;
}

function getPriceForOperation(operation: Operation) {
  if (operation.symbol && marketPrices[operation.symbol]) {
    return marketPrices[operation.symbol];
  }

  return {
    price: operation.unitPrice ?? operation.grossAmount ?? 0,
    currencyCode: operation.currencyCode,
  };
}

export function buildDashboardSummary(
  portfolios: Portfolio[],
  operations: Operation[],
  baseCurrency: BaseCurrency,
): DashboardSummary {
  const sortedOperations = [...operations].sort((left, right) =>
    left.executedAt.localeCompare(right.executedAt),
  );

  const positionsByKey = new Map<string, PositionAccumulator>();
  const cashByPortfolio = new Map<string, number>();

  for (const operation of sortedOperations) {
    const cashBalance = cashByPortfolio.get(operation.portfolioId) ?? 0;

    if (operation.type === "DEPOSIT") {
      const amount = operation.grossAmount ?? 0;
      cashByPortfolio.set(
        operation.portfolioId,
        cashBalance + convertAmount(amount, operation.currencyCode, baseCurrency),
      );
      continue;
    }

    if (operation.type === "WITHDRAW") {
      const amount = operation.grossAmount ?? 0;
      cashByPortfolio.set(
        operation.portfolioId,
        cashBalance - convertAmount(amount, operation.currencyCode, baseCurrency),
      );
      continue;
    }

    const symbolKey =
      operation.symbol ??
      operation.instrumentName ??
      `${operation.portfolioId}-${operation.id}`;
    const mapKey = `${operation.portfolioId}:${symbolKey}`;
    const quantity = operation.quantity ?? 0;
    const unitPrice = operation.unitPrice ?? 0;
    const feeAmount = operation.feeAmount ?? 0;
    const accumulator = positionsByKey.get(mapKey) ?? {
      portfolioId: operation.portfolioId,
      symbolKey,
      assetType: operation.assetType ?? "OTHER",
      instrumentName: operation.instrumentName ?? symbolKey,
      currencyCode: operation.currencyCode,
      quantity: 0,
      totalCost: 0,
    };

    if (operation.type === "BUY") {
      accumulator.quantity += quantity;
      accumulator.totalCost += quantity * unitPrice + feeAmount;
      positionsByKey.set(mapKey, accumulator);

      cashByPortfolio.set(
        operation.portfolioId,
        cashBalance -
          convertAmount(quantity * unitPrice + feeAmount, operation.currencyCode, baseCurrency),
      );
      continue;
    }

    if (operation.type === "SELL") {
      const averageCost =
        accumulator.quantity > 0 ? accumulator.totalCost / accumulator.quantity : 0;
      const soldCost = averageCost * quantity;
      accumulator.quantity -= quantity;
      accumulator.totalCost -= soldCost;

      if (accumulator.quantity <= 0.00000001) {
        positionsByKey.delete(mapKey);
      } else {
        positionsByKey.set(mapKey, accumulator);
      }

      cashByPortfolio.set(
        operation.portfolioId,
        cashBalance +
          convertAmount(quantity * unitPrice - feeAmount, operation.currencyCode, baseCurrency),
      );
    }
  }

  const positions = Array.from(positionsByKey.values()).map((position) => {
    const pricingSeed = getPriceForOperation({
      id: "",
      portfolioId: position.portfolioId,
      type: "BUY",
      assetType: position.assetType as Operation["assetType"],
      instrumentName: position.instrumentName,
      symbol: position.symbolKey,
      quantity: position.quantity,
      unitPrice: position.quantity > 0 ? position.totalCost / position.quantity : 0,
      feeAmount: 0,
      currencyCode: position.currencyCode,
      executedAt: "",
    });

    const averageCost =
      position.quantity > 0 ? position.totalCost / position.quantity : 0;
    const marketValue = position.quantity * pricingSeed.price;
    const costBasis = position.totalCost;
    const marketValueBase = convertAmount(
      marketValue,
      pricingSeed.currencyCode,
      baseCurrency,
    );
    const costBasisBase = convertAmount(costBasis, position.currencyCode, baseCurrency);
    const unrealizedPnlBase = marketValueBase - costBasisBase;

    return {
      portfolioId: position.portfolioId,
      instrumentName: position.instrumentName,
      symbolKey: position.symbolKey,
      assetType: position.assetType,
      quantity: position.quantity,
      averageCost,
      currentPrice: pricingSeed.price,
      marketValueBase,
      costBasisBase,
      unrealizedPnlBase,
      unrealizedPnlPercent:
        costBasisBase > 0 ? (unrealizedPnlBase / costBasisBase) * 100 : 0,
    };
  });

  const portfolioSummaries = portfolios.map((portfolio) => {
    const portfolioPositions = positions.filter(
      (position) => position.portfolioId === portfolio.id,
    );
    const marketValueBase = portfolioPositions.reduce(
      (total, position) => total + position.marketValueBase,
      0,
    );
    const investedBase = portfolioPositions.reduce(
      (total, position) => total + position.costBasisBase,
      0,
    );
    const cashBalanceBase = cashByPortfolio.get(portfolio.id) ?? 0;

    return {
      portfolioId: portfolio.id,
      name: portfolio.name,
      institutionLabel: portfolio.institutionLabel,
      positionsCount: portfolioPositions.length,
      cashBalanceBase,
      investedBase,
      marketValueBase,
      totalValueBase: marketValueBase + cashBalanceBase,
      unrealizedPnlBase: marketValueBase - investedBase,
    };
  });

  const totalValueBase = portfolioSummaries.reduce(
    (total, portfolio) => total + portfolio.totalValueBase,
    0,
  );
  const totalInvestedBase = portfolioSummaries.reduce(
    (total, portfolio) => total + portfolio.investedBase,
    0,
  );
  const totalCashBase = portfolioSummaries.reduce(
    (total, portfolio) => total + portfolio.cashBalanceBase,
    0,
  );
  const totalUnrealizedPnlBase = portfolioSummaries.reduce(
    (total, portfolio) => total + portfolio.unrealizedPnlBase,
    0,
  );

  return {
    positions,
    portfolios: portfolioSummaries,
    totalValueBase,
    totalInvestedBase,
    totalCashBase,
    totalUnrealizedPnlBase,
  };
}
