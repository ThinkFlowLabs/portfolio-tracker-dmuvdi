import { Trade, TradeStats, CumulativePnLPoint, MonthlyPerformance } from '@/types/trade';

export function calculatePnL(trades: Trade[]): Trade[] {
  const positions: { [symbol: string]: { quantity: number; avgPrice: number } } = {};
  const tradesWithPnL: Trade[] = [];

  for (const trade of trades) {
    const symbol = trade.symbol;

    if (trade.side === 'Compra') {
      if (!positions[symbol]) {
        positions[symbol] = { quantity: 0, avgPrice: 0 };
      }

      // If we have a short position, Compra closes it (generates P&L)
      if (positions[symbol].quantity < 0) {
        const pnl = (positions[symbol].avgPrice - trade.price) * Math.abs(trade.quantity) - trade.commission;
        positions[symbol].quantity += trade.quantity;

        if (Math.abs(positions[symbol].quantity) < 0.0001) {
          delete positions[symbol];
        }

        tradesWithPnL.push({ ...trade, pnl });
      } else {
        // Opening or adding to long position
        const totalCost = positions[symbol].quantity * positions[symbol].avgPrice + trade.quantity * trade.price;
        positions[symbol].quantity += trade.quantity;
        positions[symbol].avgPrice = totalCost / positions[symbol].quantity;

        tradesWithPnL.push({ ...trade, pnl: -trade.commission });
      }
    } else if (trade.side === 'Cierre') {
      if (positions[symbol]) {
        const quantityToClose = Math.abs(trade.quantity);
        let pnl = 0;

        if (positions[symbol].quantity > 0) {
          // Closing LONG position: P&L = (sell_price - avg_buy_price) * quantity
          pnl = (trade.price - positions[symbol].avgPrice) * quantityToClose - trade.commission;
          positions[symbol].quantity -= quantityToClose;
        } else {
          // Closing SHORT position: P&L = (avg_sell_price - buy_price) * quantity
          pnl = (positions[symbol].avgPrice - trade.price) * quantityToClose - trade.commission;
          positions[symbol].quantity += quantityToClose;
        }

        if (Math.abs(positions[symbol].quantity) < 0.0001) {
          delete positions[symbol];
        }

        tradesWithPnL.push({ ...trade, pnl });
      } else {
        tradesWithPnL.push({ ...trade, pnl: 0 });
      }
    } else if (trade.side === 'Venta') {
      // Venta is a short sale - opening a negative position or closing a long position
      if (!positions[symbol]) {
        positions[symbol] = { quantity: 0, avgPrice: 0 };
      }

      // If we have a long position, treat Venta as closing it
      if (positions[symbol].quantity > 0) {
        const pnl = (trade.price - positions[symbol].avgPrice) * Math.abs(trade.quantity) - trade.commission;
        positions[symbol].quantity -= Math.abs(trade.quantity);

        if (Math.abs(positions[symbol].quantity) < 0.0001) {
          delete positions[symbol];
        }

        tradesWithPnL.push({ ...trade, pnl });
      } else {
        // Opening or adding to short position
        const currentValue = Math.abs(positions[symbol].quantity) * positions[symbol].avgPrice;
        const newValue = Math.abs(trade.quantity) * trade.price;
        const totalQuantity = Math.abs(positions[symbol].quantity) + Math.abs(trade.quantity);

        positions[symbol].quantity -= Math.abs(trade.quantity);
        positions[symbol].avgPrice = (currentValue + newValue) / totalQuantity;

        tradesWithPnL.push({ ...trade, pnl: -trade.commission });
      }
    }
  }

  return tradesWithPnL;
}

export function calculateCumulativePnL(trades: Trade[]): CumulativePnLPoint[] {
  const tradesWithPnL = calculatePnL(trades);
  let cumulative = 0;
  const points: CumulativePnLPoint[] = [];

  for (const trade of tradesWithPnL) {
    if (trade.pnl !== undefined) {
      cumulative += trade.pnl;
      points.push({
        date: trade.date,
        value: cumulative,
      });
    }
  }

  return points;
}

// New function for mark-to-market cumulative P&L using historical data
export async function calculateMarkToMarketCumulativePnL(
  transactionPortfolioJson: FirebaseTransaction[],
  closedTransactionsJson: FirebaseTransaction[],
  onProgress?: (current: number, total: number, currentMonth: string) => void,
): Promise<CumulativePnLPoint[]> {
  try {
    // Get monthly portfolio history with mark-to-market values
    const portfolioHistory = await calculateMonthlyPortfolioHistory(
      transactionPortfolioJson,
      closedTransactionsJson,
      onProgress,
    );

    const points: CumulativePnLPoint[] = [];

    // Convert monthly history to cumulative P&L points
    for (const monthData of portfolioHistory.history) {
      // Use last day of month for the date
      const [year, month] = monthData.month.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const dateStr = `${month.toString().padStart(2, '0')}/${lastDay.toString().padStart(2, '0')}/${year}`;

      // Calculate the total value vs total invested for mark-to-market P&L
      // portfolio_value is the current market value
      // We need to calculate what was actually invested vs current value
      const totalInvestedThisMonth = monthData.assets.reduce((sum, asset) => {
        return sum + asset.avg_price * asset.shares;
      }, 0);

      const markToMarketPL = monthData.portfolio_value - totalInvestedThisMonth;

      points.push({
        date: dateStr,
        value: markToMarketPL, // Corrected mark-to-market P&L
      });
    }

    console.log(`Generated ${points.length} mark-to-market data points`);
    return points;
  } catch (error) {
    console.error('Error calculating mark-to-market cumulative P&L:', error);
    // Fallback to traditional calculation if API fails
    const trades = parseFirebaseJson(transactionPortfolioJson, closedTransactionsJson);
    return calculateCumulativePnL(trades);
  }
}

export function calculateTotalInvested(trades: Trade[]): number {
  // Sum only Compra transactions from transaction_portfolio.json
  // This should match the $38,416.71 from the portfolio data
  const buyTrades = trades.filter(t => t.side === 'Compra');
  const totalInvested = buyTrades.reduce((sum, t) => sum + Math.abs(t.quantity) * t.price, 0);
  return totalInvested;
}

export function calculateStats(trades: Trade[]): TradeStats {
  const tradesWithPnL = calculatePnL(trades);
  const closingTrades = tradesWithPnL.filter(
    t => (t.side === 'Cierre' || t.side === 'Venta') && t.pnl !== undefined && t.pnl !== 0,
  );

  const totalPnL = closingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = closingTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = closingTrades.filter(t => (t.pnl || 0) < 0);

  const totalTrades = closingTrades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  const averageWin =
    winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;

  const averageLoss =
    losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length : 0;

  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0;

  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0;

  const averageTradePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

  return {
    totalPnL,
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    averageTradePnL,
  };
}

export function calculateMonthlyPerformance(trades: Trade[]): MonthlyPerformance[] {
  const tradesWithPnL = calculatePnL(trades);

  // Filter trades that generate realized P&L (both closing longs and shorts)
  const realizingTrades = tradesWithPnL.filter(t => {
    // Include any trade that has actual P&L (positive or negative)
    // This captures:
    // - Cierre: Always closes a position
    // - Venta: When closing a long position (generates P&L)
    // - Compra: When closing a short position (generates P&L)
    return t.pnl !== undefined && t.pnl !== 0 && Math.abs(t.pnl) > 0.01; // Ignore tiny commission-only P&L
  });

  const monthlyData: { [month: string]: { trades: number; pnl: number } } = {};

  // Count ALL trades (Compra, Venta, Cierre) for trade count
  for (const trade of tradesWithPnL) {
    const date = new Date(trade.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { trades: 0, pnl: 0 };
    }

    monthlyData[monthKey].trades += 1;
  }

  // Add P&L only from trades that realize gains/losses
  for (const trade of realizingTrades) {
    const date = new Date(trade.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (monthlyData[monthKey]) {
      monthlyData[monthKey].pnl += trade.pnl || 0;
    }
  }

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      trades: data.trades,
      pnl: data.pnl,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

interface FirestorePath {
  segments: string[];
}

interface FirestoreReference {
  _path: FirestorePath;
}

interface FirebaseTransaction {
  id: string;
  ticker: string;
  amount: number;
  price: number;
  created_time: FirestoreTimestamp;
  operation: string;
  id_portfolio: FirestoreReference;
  id_asset?: FirestoreReference;
  name?: string;
  amount_usd?: number;
}

function convertTimestampToDate(timestamp: FirestoreTimestamp): string {
  const date = new Date(timestamp._seconds * 1000);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function convertTimestampToTime(timestamp: FirestoreTimestamp): string {
  const date = new Date(timestamp._seconds * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function getPortfolioId(portfolioRef: FirestoreReference): string {
  return portfolioRef._path.segments[1];
}

function getAssetId(assetRef?: FirestoreReference): string | null {
  return assetRef ? assetRef._path.segments[1] : null;
}

interface AssetPosition {
  asset: string;
  id_asset: string;
  total_shares: number;
  avg_price: number;
  closed_shares: number;
  is_closed: boolean;
  total_invested: number;
  closed_value: number;
  profit_loss: number;
  date_closed?: number;
}

interface MonthlyAsset {
  asset: string;
  id_asset: string;
  shares: number;
  avg_price: number;
  price_close: number;
  value: number;
  profit_loss: number;
}

interface MonthlyPortfolioHistory {
  month: string;
  assets: MonthlyAsset[];
  portfolio_value: number;
  portfolio_pl: number;
}

interface PortfolioHistory {
  portfolio: string;
  history: MonthlyPortfolioHistory[];
}

interface GroupedAssetTransaction {
  asset: string;
  id_asset: string;
  positions: {
    id: string;
    ticker: string;
    name: string;
    operation: string;
    amount: number;
    price: number;
    amount_usd: number;
    created_time: number;
  }[];
}

export function calculateAssetPositions(
  transactionPortfolioJson: FirebaseTransaction[],
  closedTransactionsJson: FirebaseTransaction[],
): AssetPosition[] {
  const TARGET_PORTFOLIO_ID = 'Kq0kpiyAuukdS2l4uvDb';

  // First, group transactions by id_asset
  const groupedAssets: { [id_asset: string]: GroupedAssetTransaction } = {};

  // Combine both arrays
  const allTransactions = [...transactionPortfolioJson, ...closedTransactionsJson];

  // Group transactions by id_asset
  for (const transaction of allTransactions) {
    const portfolioId = getPortfolioId(transaction.id_portfolio);

    if (portfolioId !== TARGET_PORTFOLIO_ID) {
      continue;
    }

    // Extract id_asset from the transaction
    const id_asset = getAssetId(transaction.id_asset) || transaction.ticker; // fallback to ticker if no id_asset

    if (!groupedAssets[id_asset]) {
      groupedAssets[id_asset] = {
        asset: transaction.ticker,
        id_asset: id_asset,
        positions: [],
      };
    }

    groupedAssets[id_asset].positions.push({
      id: transaction.id,
      ticker: transaction.ticker,
      name: transaction.name || transaction.ticker,
      operation: transaction.operation,
      amount: transaction.amount,
      price: transaction.price,
      amount_usd: transaction.amount * transaction.price,
      created_time: transaction.created_time._seconds,
    });
  }

  // Calculate positions for each asset
  const assetPositions: AssetPosition[] = [];

  for (const [id_asset, grouped] of Object.entries(groupedAssets)) {
    // Sort positions by date
    grouped.positions.sort((a, b) => a.created_time - b.created_time);

    let totalShares = 0;
    let totalInvested = 0;
    let closedShares = 0;
    let closedValue = 0;
    let isShort = false;
    let dateClose: number | undefined;

    // Process each position chronologically
    for (const position of grouped.positions) {
      if (position.operation === 'Compra') {
        if (totalShares < 0) {
          // Closing short position
          const sharesToClose = Math.min(Math.abs(totalShares), position.amount);
          closedShares += sharesToClose;
          closedValue += sharesToClose * position.price;
          totalShares += position.amount;

          if (position.amount > sharesToClose) {
            // Opening long with remaining shares
            const remainingShares = position.amount - sharesToClose;
            totalInvested += remainingShares * position.price;
          }
        } else {
          // Opening or adding to long position
          totalShares += position.amount;
          totalInvested += position.amount_usd;
        }
      } else if (position.operation === 'Venta') {
        if (totalShares > 0) {
          // Closing long position
          const sharesToClose = Math.min(totalShares, position.amount);
          closedShares += sharesToClose;
          closedValue += sharesToClose * position.price;
          totalShares -= position.amount;

          if (position.amount > sharesToClose) {
            // Opening short with remaining shares
            const remainingShares = position.amount - sharesToClose;
            totalInvested += remainingShares * position.price;
            isShort = true;
          }
        } else {
          // Opening or adding to short position
          totalShares -= position.amount;
          totalInvested += position.amount_usd;
          isShort = true;
        }
      } else if (position.operation === 'Cierre') {
        // Closing any position
        closedShares += Math.abs(totalShares);
        closedValue += Math.abs(totalShares) * position.price;
        totalShares = 0;
        dateClose = position.created_time;
      }
    }

    // Calculate average price and profit/loss
    const avgPrice = closedShares > 0 ? totalInvested / Math.abs(totalShares + closedShares) : 0;
    let profitLoss = 0;

    if (isShort) {
      // For short positions: profit when sell price > buy price
      profitLoss = totalInvested - closedValue;
    } else {
      // For long positions: profit when buy price < sell price
      profitLoss = closedValue - totalInvested;
    }

    assetPositions.push({
      asset: grouped.asset,
      id_asset: id_asset,
      total_shares: Math.abs(totalShares + closedShares),
      avg_price: avgPrice,
      closed_shares: closedShares,
      is_closed: Math.abs(totalShares) < 0.001,
      total_invested: totalInvested,
      closed_value: closedValue,
      profit_loss: profitLoss,
      date_closed: dateClose,
    });
  }

  return assetPositions;
}

// Helper function to get historical prices for multiple tickers using batch API
async function getBatchHistoricalPrices(
  tickers: string[],
  year: number,
  month: number,
): Promise<{ [ticker: string]: number }> {
  try {
    // Get last day of the month for closing price
    const lastDay = new Date(year, month, 0).getDate();
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    // Prepare symbols array - assuming all are stocks for now
    const symbols = tickers.map(ticker => ({
      symbol: ticker,
      type: 'stock', // Default to stock, could be enhanced to detect crypto/forex
    }));

    const requestBody = {
      symbols: symbols,
      date: dateStr,
    };

    console.log(`Fetching batch prices for ${tickers.length} symbols on ${dateStr}`);

    const response = await fetch('https://bitfinserver-production.up.railway.app/api/tickers/historical-prices/date', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.warn(`Failed to get batch prices on ${dateStr}, status: ${response.status}`);
      return {};
    }

    const data = await response.json();

    if (data.success && data.data) {
      const priceMap: { [ticker: string]: number } = {};

      for (const priceData of data.data) {
        if (priceData.priceFound && priceData.price > 0) {
          priceMap[priceData.symbol] = priceData.price;
          console.log(`Got price for ${priceData.symbol} on ${dateStr}: $${priceData.price}`);
        } else {
          console.warn(`No price data for ${priceData.symbol} on ${dateStr}`);
          priceMap[priceData.symbol] = 0;
        }
      }

      console.log(`Batch API: ${data.pricesFound}/${data.totalTickers} prices found for ${dateStr}`);
      return priceMap;
    } else {
      console.warn(`No batch price data for ${dateStr}`);
      return {};
    }
  } catch (error) {
    console.error(`Error fetching batch prices for ${year}-${month}:`, error);
    return {};
  }
}

// Helper function to generate month range
function generateMonthRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthKey);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export async function calculateMonthlyPortfolioHistory(
  transactionPortfolioJson: FirebaseTransaction[],
  closedTransactionsJson: FirebaseTransaction[],
  onProgress?: (current: number, total: number, currentMonth: string) => void,
): Promise<PortfolioHistory> {
  const TARGET_PORTFOLIO_ID = 'Kq0kpiyAuukdS2l4uvDb';

  // Get all transactions sorted by date
  const allTransactions = [...transactionPortfolioJson, ...closedTransactionsJson]
    .filter(t => getPortfolioId(t.id_portfolio) === TARGET_PORTFOLIO_ID)
    .sort((a, b) => a.created_time._seconds - b.created_time._seconds);

  if (allTransactions.length === 0) {
    return { portfolio: TARGET_PORTFOLIO_ID, history: [] };
  }

  // Get date range
  const startDate = new Date(allTransactions[0].created_time._seconds * 1000);
  const endDate = new Date(); // Current date
  const monthRange = generateMonthRange(startDate, endDate);

  const history: MonthlyPortfolioHistory[] = [];

  // Track positions over time
  const positions: {
    [id_asset: string]: {
      ticker: string;
      shares: number;
      totalCost: number;
      isShort: boolean;
      transactions: FirebaseTransaction[];
    };
  } = {};

  for (let i = 0; i < monthRange.length; i++) {
    const monthKey = monthRange[i];
    const [year, month] = monthKey.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // Report progress
    if (onProgress) {
      onProgress(i + 1, monthRange.length, monthKey);
    }

    // Process transactions that happened up to this month
    const transactionsThisMonth = allTransactions.filter(t => {
      const transactionDate = new Date(t.created_time._seconds * 1000);
      return transactionDate <= monthEnd;
    });

    // Update positions based on transactions up to this month
    const currentPositions: { [id_asset: string]: (typeof positions)[''] } = {};

    for (const transaction of transactionsThisMonth) {
      const id_asset = getAssetId(transaction.id_asset) || transaction.ticker;

      if (!currentPositions[id_asset]) {
        currentPositions[id_asset] = {
          ticker: transaction.ticker,
          shares: 0,
          totalCost: 0,
          isShort: false,
          transactions: [],
        };
      }

      const position = currentPositions[id_asset];
      position.transactions.push(transaction);

      if (transaction.operation === 'Compra') {
        if (position.shares < 0) {
          // Closing short position
          const sharesToClose = Math.min(Math.abs(position.shares), transaction.amount);
          position.shares += sharesToClose;

          if (transaction.amount > sharesToClose) {
            // Opening long with remaining
            const remainingShares = transaction.amount - sharesToClose;
            position.shares += remainingShares;
            position.totalCost += remainingShares * transaction.price;
            position.isShort = false;
          }
        } else {
          // Opening or adding to long
          position.totalCost += transaction.amount * transaction.price;
          position.shares += transaction.amount;
          position.isShort = false;
        }
      } else if (transaction.operation === 'Venta') {
        if (position.shares > 0) {
          // Closing long position
          const sharesToClose = Math.min(position.shares, transaction.amount);
          position.shares -= sharesToClose;

          if (transaction.amount > sharesToClose) {
            // Opening short with remaining
            const remainingShares = transaction.amount - sharesToClose;
            position.shares -= remainingShares;
            position.totalCost += remainingShares * transaction.price;
            position.isShort = true;
          }
        } else {
          // Opening or adding to short
          position.totalCost += transaction.amount * transaction.price;
          position.shares -= transaction.amount;
          position.isShort = true;
        }
      } else if (transaction.operation === 'Cierre') {
        // Close position completely
        position.shares = 0;
        position.totalCost = 0;
        position.isShort = false;
      }
    }

    // Calculate month-end values for open positions
    const monthlyAssets: MonthlyAsset[] = [];
    let portfolioValue = 0;
    let portfolioPL = 0;

    // Get unique tickers for batch processing
    const openPositions = Object.entries(currentPositions).filter(([_, position]) => Math.abs(position.shares) > 0.001);

    if (openPositions.length > 0) {
      console.log(`Processing ${openPositions.length} open positions for ${monthKey}`);

      // Get all unique tickers for this month
      const tickers = openPositions.map(([_, position]) => position.ticker);
      const uniqueTickers = [...new Set(tickers)];

      // Fetch all prices in one batch call
      const priceMap = await getBatchHistoricalPrices(uniqueTickers, year, month);

      for (const [id_asset, position] of openPositions) {
        const priceClose = priceMap[position.ticker] || 0;

        if (priceClose > 0) {
          const avgPrice = position.totalCost / Math.abs(position.shares);
          const value = Math.abs(position.shares) * priceClose;

          let profitLoss = 0;
          if (position.isShort) {
            // Short position: profit when avgPrice > priceClose (sold high, buying low)
            profitLoss = (avgPrice - priceClose) * Math.abs(position.shares);
          } else {
            // Long position: profit when priceClose > avgPrice (bought low, selling high)
            profitLoss = (priceClose - avgPrice) * Math.abs(position.shares);
          }

          console.log(
            `${position.ticker}: ${position.isShort ? 'SHORT' : 'LONG'} - Avg: $${avgPrice.toFixed(
              2,
            )}, Close: $${priceClose}, P&L: $${profitLoss.toFixed(2)}`,
          );

          monthlyAssets.push({
            asset: position.ticker,
            id_asset: id_asset,
            shares: Math.abs(position.shares),
            avg_price: avgPrice,
            price_close: priceClose,
            value: value,
            profit_loss: profitLoss,
          });

          portfolioValue += value;
          portfolioPL += profitLoss;
        } else {
          console.warn(`Skipping ${position.ticker} for ${monthKey} - no price data`);
        }
      }
    }

    if (monthlyAssets.length > 0) {
      console.log(
        `${monthKey}: Portfolio Value: $${portfolioValue.toFixed(2)}, Portfolio P&L: $${portfolioPL.toFixed(2)}`,
      );

      history.push({
        month: monthKey,
        assets: monthlyAssets,
        portfolio_value: portfolioValue,
        portfolio_pl: portfolioPL,
      });
    }
  }

  return {
    portfolio: TARGET_PORTFOLIO_ID,
    history: history,
  };
}

export function parseFirebaseJson(
  transactionPortfolioJson: FirebaseTransaction[],
  closedTransactionsJson: FirebaseTransaction[],
): Trade[] {
  const TARGET_PORTFOLIO_ID = 'Kq0kpiyAuukdS2l4uvDb';
  const trades: Trade[] = [];

  // Combine both arrays
  const allTransactions = [...transactionPortfolioJson, ...closedTransactionsJson];

  // Filter by portfolio ID and convert to Trade format
  for (const transaction of allTransactions) {
    const portfolioId = getPortfolioId(transaction.id_portfolio);

    if (portfolioId !== TARGET_PORTFOLIO_ID) {
      continue;
    }

    const date = convertTimestampToDate(transaction.created_time);
    const time = convertTimestampToTime(transaction.created_time);

    // Map operation to quantity sign
    let quantity = transaction.amount;
    if (transaction.operation === 'Venta' || transaction.operation === 'Cierre') {
      quantity = -Math.abs(quantity);
    } else {
      quantity = Math.abs(quantity);
    }

    trades.push({
      id: transaction.id,
      date,
      time,
      symbol: transaction.ticker,
      quantity,
      price: transaction.price,
      side: transaction.operation as 'Compra' | 'Cierre' | 'Venta',
      commission: 0, // Commission is always 0 per requirements
    });
  }

  // Sort by timestamp (oldest first)
  trades.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  return trades;
}
