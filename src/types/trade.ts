export interface Trade {
  id: string;
  date: string;
  time: string;
  symbol: string;
  quantity: number;
  price: number;
  side: 'Compra' | 'Cierre';
  commission: number;
  pnl?: number;
}

export interface TradeStats {
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageTradePnL: number;
}

export interface CumulativePnLPoint {
  date: string;
  value: number;
}

export interface MonthlyPerformance {
  month: string;
  trades: number;
  pnl: number;
}
