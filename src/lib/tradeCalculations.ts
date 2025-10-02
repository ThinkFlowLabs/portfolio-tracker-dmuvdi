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

      const totalCost = positions[symbol].quantity * positions[symbol].avgPrice + trade.quantity * trade.price;
      positions[symbol].quantity += trade.quantity;
      positions[symbol].avgPrice = totalCost / positions[symbol].quantity;

      tradesWithPnL.push({ ...trade, pnl: -trade.commission });
    } else if (trade.side === 'Cierre') {
      if (positions[symbol]) {
        const pnl = (trade.price - positions[symbol].avgPrice) * Math.abs(trade.quantity) - trade.commission;
        positions[symbol].quantity += trade.quantity;

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
        // Opening a short position - no realized P&L yet
        const totalCost = positions[symbol].quantity * positions[symbol].avgPrice - trade.quantity * trade.price;
        positions[symbol].quantity -= Math.abs(trade.quantity);
        positions[symbol].avgPrice = positions[symbol].quantity !== 0 ? totalCost / positions[symbol].quantity : 0;

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

export function calculateTotalInvested(trades: Trade[]): number {
  const buyTrades = trades.filter(t => t.side === 'Compra');
  const totalInvested = buyTrades.reduce((sum, t) => sum + (t.quantity * t.price), 0);
  return totalInvested;
}

export function calculateStats(trades: Trade[]): TradeStats {
  const tradesWithPnL = calculatePnL(trades);
  const closingTrades = tradesWithPnL.filter(t => (t.side === 'Cierre' || t.side === 'Venta') && t.pnl !== undefined && t.pnl !== 0);

  const totalPnL = closingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = closingTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = closingTrades.filter(t => (t.pnl || 0) < 0);

  const totalTrades = closingTrades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  const averageWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
    : 0;

  const averageLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length
    : 0;

  const largestWin = winningTrades.length > 0
    ? Math.max(...winningTrades.map(t => t.pnl || 0))
    : 0;

  const largestLoss = losingTrades.length > 0
    ? Math.min(...losingTrades.map(t => t.pnl || 0))
    : 0;

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
  const closingTrades = tradesWithPnL.filter(t => (t.side === 'Cierre' || t.side === 'Venta') && t.pnl !== undefined && t.pnl !== 0);
  
  const monthlyData: { [month: string]: { trades: number; pnl: number } } = {};

  for (const trade of closingTrades) {
    const date = new Date(trade.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { trades: 0, pnl: 0 };
    }
    
    monthlyData[monthKey].trades += 1;
    monthlyData[monthKey].pnl += trade.pnl || 0;
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

export function parseFirebaseJson(
  transactionPortfolioJson: FirebaseTransaction[],
  closedTransactionsJson: FirebaseTransaction[]
): Trade[] {
  const TARGET_PORTFOLIO_ID = "Kq0kpiyAuukdS2l4uvDb";
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
