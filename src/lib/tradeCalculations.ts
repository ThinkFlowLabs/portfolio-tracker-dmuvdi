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

export function calculateStats(trades: Trade[]): TradeStats {
  const tradesWithPnL = calculatePnL(trades);
  const closingTrades = tradesWithPnL.filter(t => t.side === 'Cierre' && t.pnl !== undefined);

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
  const closingTrades = tradesWithPnL.filter(t => t.side === 'Cierre' && t.pnl !== undefined);
  
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

export function parseCsvTrades(csvContent: string): Trade[] {
  const lines = csvContent.trim().split('\n');
  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length < 7) continue;

    trades.push({
      id: `${parts[0]}-${parts[1]}-${parts[2]}-${i}`,
      date: parts[0],
      time: parts[1],
      symbol: parts[2],
      quantity: parseFloat(parts[3]),
      price: parseFloat(parts[4]),
      side: parts[5] as 'Compra' | 'Cierre',
      commission: parseFloat(parts[6]),
    });
  }

  return trades;
}
