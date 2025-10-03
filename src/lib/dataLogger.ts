import { Trade, CumulativePnLPoint, TradeStats, MonthlyPerformance } from '@/types/trade';

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

interface FirestoreReference {
  _path: {
    segments: string[];
  };
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

interface PositionTrackingEntry {
  month: string;
  positions: {
    [asset: string]: {
      ticker: string;
      shares: number;
      totalCost: number;
      isShort: boolean;
      transactions: FirebaseTransaction[];
    };
  };
  timestamp: string;
}

interface MonthlyCalculationEntry {
  month: string;
  calculation: {
    openPositions: number;
    portfolioValue: number;
    portfolioPL: number;
    assetsProcessed: string[];
  };
  timestamp: string;
}

interface ApiCallEntry {
  timestamp: string;
  endpoint: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  duration: number;
}

interface LogData {
  timestamp: string;
  sessionId: string;
  rawData: {
    transactionPortfolio: FirebaseTransaction[];
    closedTransactions: FirebaseTransaction[];
  };
  processedData: {
    parsedTrades: Trade[];
    monthlyHistory: PortfolioHistory;
    cumulativePnLData: CumulativePnLPoint[];
    tradingStats: TradeStats | null;
    monthlyPerformance: MonthlyPerformance[] | null;
    totalInvested: number | null;
  };
  calculations: {
    positionTracking: PositionTrackingEntry[];
    priceData: { [ticker: string]: { [date: string]: number } };
    monthlyCalculations: MonthlyCalculationEntry[];
  };
  apiCalls: ApiCallEntry[];
  errors: {
    timestamp: string;
    error: string;
    context: string;
  }[];
  summary: {
    totalTransactions: number;
    totalMonthsProcessed: number;
    totalAssets: number;
    portfolioValueRange: { min: number; max: number };
    pnlRange: { min: number; max: number };
    processingTime: number;
  };
}

class DataLogger {
  private logData: LogData;
  private startTime: number = 0;

  constructor() {
    this.logData = this.initializeLogData();
  }

  private initializeLogData(): LogData {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      timestamp: new Date().toISOString(),
      sessionId,
      rawData: {
        transactionPortfolio: [],
        closedTransactions: [],
      },
      processedData: {
        parsedTrades: [],
        monthlyHistory: { portfolio: '', history: [] },
        cumulativePnLData: [],
        tradingStats: null,
        monthlyPerformance: null,
        totalInvested: null,
      },
      calculations: {
        positionTracking: [],
        priceData: {},
        monthlyCalculations: [],
      },
      apiCalls: [],
      errors: [],
      summary: {
        totalTransactions: 0,
        totalMonthsProcessed: 0,
        totalAssets: 0,
        portfolioValueRange: { min: 0, max: 0 },
        pnlRange: { min: 0, max: 0 },
        processingTime: 0,
      },
    };
  }

  startSession() {
    this.startTime = Date.now();
    console.log(`🔍 Data Logger - Starting session: ${this.logData.sessionId}`);
  }

  logRawData(transactionPortfolio: FirebaseTransaction[], closedTransactions: FirebaseTransaction[]) {
    this.logData.rawData.transactionPortfolio = transactionPortfolio;
    this.logData.rawData.closedTransactions = closedTransactions;

    console.log(`📊 Raw Data Logged:`, {
      transactionPortfolio: transactionPortfolio.length,
      closedTransactions: closedTransactions.length,
      totalTransactions: transactionPortfolio.length + closedTransactions.length,
    });
  }

  logParsedTrades(trades: Trade[]) {
    this.logData.processedData.parsedTrades = trades;
    //console.log(`🔄 Parsed Trades:`, trades.length);
  }

  logMonthlyHistory(history: PortfolioHistory) {
    this.logData.processedData.monthlyHistory = history;
    /*console.log(`📅 Monthly History:`, {
      portfolio: history.portfolio,
      months: history.history.length,
    });*/
  }

  logCumulativePnL(data: CumulativePnLPoint[]) {
    this.logData.processedData.cumulativePnLData = data;
    //console.log(`📈 Cumulative P&L Data:`, data.length, 'points');
  }

  logTradingStats(stats: TradeStats) {
    this.logData.processedData.tradingStats = stats;
    /*console.log(`📊 Trading Statistics:`, {
      totalTrades: stats.totalTrades,
      winRate: `${stats.winRate.toFixed(1)}%`,
      totalPnL: `$${stats.totalPnL.toFixed(2)}`,
      winningTrades: stats.winningTrades,
      losingTrades: stats.losingTrades,
    });*/
  }

  logMonthlyPerformance(performance: MonthlyPerformance[]) {
    this.logData.processedData.monthlyPerformance = performance;
    //console.log(`📈 Monthly Performance:`, performance.length, 'months');
  }

  logTotalInvested(totalInvested: number) {
    this.logData.processedData.totalInvested = totalInvested;
    //console.log(`💰 Total Invested:`, `$${totalInvested.toFixed(2)}`);
  }

  logPositionTracking(
    month: string,
    positions: {
      [asset: string]: {
        ticker: string;
        shares: number;
        totalCost: number;
        isShort: boolean;
        transactions: FirebaseTransaction[];
      };
    },
  ) {
    this.logData.calculations.positionTracking.push({
      month,
      positions: JSON.parse(JSON.stringify(positions)),
      timestamp: new Date().toISOString(),
    });
  }

  logPriceData(ticker: string, date: string, price: number) {
    if (!this.logData.calculations.priceData[ticker]) {
      this.logData.calculations.priceData[ticker] = {};
    }
    this.logData.calculations.priceData[ticker][date] = price;
  }

  logMonthlyCalculation(
    month: string,
    calculation: {
      openPositions: number;
      portfolioValue: number;
      portfolioPL: number;
      assetsProcessed: string[];
    },
  ) {
    this.logData.calculations.monthlyCalculations.push({
      month,
      calculation: JSON.parse(JSON.stringify(calculation)),
      timestamp: new Date().toISOString(),
    });
  }

  logApiCall(endpoint: string, request: Record<string, unknown>, response: Record<string, unknown>, duration: number) {
    this.logData.apiCalls.push({
      timestamp: new Date().toISOString(),
      endpoint,
      request: JSON.parse(JSON.stringify(request)),
      response: JSON.parse(JSON.stringify(response)),
      duration,
    });

    //console.log(`🌐 API Call:`, { endpoint, duration: `${duration}ms` });
  }

  logError(error: string, context: string) {
    this.logData.errors.push({
      timestamp: new Date().toISOString(),
      error,
      context,
    });

    console.error(`❌ Error:`, { error, context });
  }

  finalizeSummary() {
    const processingTime = Date.now() - this.startTime;

    // Calculate summary statistics
    const allTransactions = [...this.logData.rawData.transactionPortfolio, ...this.logData.rawData.closedTransactions];

    const monthlyHistory = this.logData.processedData.monthlyHistory.history;
    const cumulativePnL = this.logData.processedData.cumulativePnLData;

    // Get unique assets
    const uniqueAssets = new Set<string>();
    monthlyHistory.forEach(month => {
      month.assets.forEach(asset => uniqueAssets.add(asset.asset));
    });

    // Calculate portfolio value range
    const portfolioValues = monthlyHistory.map(m => m.portfolio_value);
    const pnlValues = cumulativePnL.map(p => p.value);

    this.logData.summary = {
      totalTransactions: allTransactions.length,
      totalMonthsProcessed: monthlyHistory.length,
      totalAssets: uniqueAssets.size,
      portfolioValueRange: {
        min: Math.min(...portfolioValues),
        max: Math.max(...portfolioValues),
      },
      pnlRange: {
        min: Math.min(...pnlValues),
        max: Math.max(...pnlValues),
      },
      processingTime,
    };

    //console.log(`📋 Summary:`, this.logData.summary);
  }

  async generateLogFile(): Promise<void> {
    try {
      const logContent = this.generateLogContent();

      // Create a blob and download link
      const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-calculation-log-${this.logData.sessionId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      console.log(`💾 Log file generated: log-session-${this.logData.sessionId}.txt`);
    } catch (error) {
      console.error('Error generating log file:', error);
    }
  }

  private generateLogContent(): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('PORTFOLIO TRACKER - CALCULATION LOG');
    lines.push('='.repeat(80));
    lines.push('');

    // Session Info
    lines.push('SESSION INFORMATION');
    lines.push('-'.repeat(40));
    lines.push(`Session ID: ${this.logData.sessionId}`);
    lines.push(`Timestamp: ${this.logData.timestamp}`);
    lines.push(`Processing Time: ${this.logData.summary.processingTime}ms`);
    lines.push('');

    // Summary
    lines.push('SUMMARY STATISTICS');
    lines.push('-'.repeat(40));
    lines.push(`Total Transactions: ${this.logData.summary.totalTransactions}`);
    lines.push(`Months Processed: ${this.logData.summary.totalMonthsProcessed}`);
    lines.push(`Unique Assets: ${this.logData.summary.totalAssets}`);
    lines.push(
      `Portfolio Value Range: $${this.logData.summary.portfolioValueRange.min.toFixed(
        2,
      )} - $${this.logData.summary.portfolioValueRange.max.toFixed(2)}`,
    );
    lines.push(
      `P&L Range: $${this.logData.summary.pnlRange.min.toFixed(2)} - $${this.logData.summary.pnlRange.max.toFixed(2)}`,
    );
    lines.push('');

    // Raw Data Overview
    lines.push('RAW DATA OVERVIEW');
    lines.push('-'.repeat(40));
    lines.push(`Transaction Portfolio Records: ${this.logData.rawData.transactionPortfolio.length}`);
    lines.push(`Closed Transactions Records: ${this.logData.rawData.closedTransactions.length}`);
    lines.push('');

    // Sample Raw Transactions
    lines.push('SAMPLE RAW TRANSACTIONS (First 5)');
    lines.push('-'.repeat(40));
    const sampleTransactions = this.logData.rawData.transactionPortfolio.slice(0, 5);
    sampleTransactions.forEach((tx, i) => {
      lines.push(
        `${i + 1}. ${tx.ticker} - ${tx.operation} - ${tx.amount} @ $${tx.price} (${new Date(
          tx.created_time._seconds * 1000,
        ).toDateString()})`,
      );
    });
    lines.push('');

    // Parsed Trades
    lines.push('PARSED TRADES OVERVIEW');
    lines.push('-'.repeat(40));
    lines.push(`Total Parsed Trades: ${this.logData.processedData.parsedTrades.length}`);

    // Group by symbol
    const tradesBySymbol: { [symbol: string]: Trade[] } = {};
    this.logData.processedData.parsedTrades.forEach(trade => {
      if (!tradesBySymbol[trade.symbol]) {
        tradesBySymbol[trade.symbol] = [];
      }
      tradesBySymbol[trade.symbol].push(trade);
    });

    lines.push('Trades by Symbol:');
    Object.entries(tradesBySymbol).forEach(([symbol, trades]) => {
      const totalQty = trades.reduce((sum, t) => sum + t.quantity, 0);
      lines.push(`  ${symbol}: ${trades.length} trades, Net Quantity: ${totalQty}`);
    });
    lines.push('');

    // Monthly History Details
    lines.push('MONTHLY PORTFOLIO HISTORY');
    lines.push('-'.repeat(40));
    this.logData.processedData.monthlyHistory.history.forEach(month => {
      lines.push(`${month.month}:`);
      lines.push(`  Portfolio Value: $${month.portfolio_value.toFixed(2)}`);
      lines.push(`  Portfolio P&L: $${month.portfolio_pl.toFixed(2)}`);
      lines.push(`  Assets: ${month.assets.length}`);

      month.assets.forEach(asset => {
        lines.push(
          `    ${asset.asset}: ${asset.shares} shares @ $${asset.avg_price.toFixed(
            2,
          )} avg, Close: $${asset.price_close.toFixed(2)}, P&L: $${asset.profit_loss.toFixed(2)}`,
        );
      });
      lines.push('');
    });

    // API Calls
    lines.push('API CALLS LOG');
    lines.push('-'.repeat(40));
    this.logData.apiCalls.forEach((call, i) => {
      lines.push(`${i + 1}. ${call.endpoint} (${call.duration}ms)`);
      lines.push(`   Request: ${JSON.stringify(call.request).substring(0, 200)}...`);
      lines.push(`   Response Size: ${JSON.stringify(call.response).length} characters`);
      lines.push('');
    });

    // Position Tracking
    lines.push('POSITION TRACKING BY MONTH');
    lines.push('-'.repeat(40));
    this.logData.calculations.positionTracking.forEach(entry => {
      lines.push(`${entry.month}:`);
      Object.entries(entry.positions).forEach(([asset, position]) => {
        lines.push(
          `  ${asset}: Shares: ${position.shares}, Avg Price: $${
            position.totalCost / Math.abs(position.shares) || 0
          }, Short: ${position.isShort}`,
        );
      });
      lines.push('');
    });

    // Price Data Summary
    lines.push('PRICE DATA SUMMARY');
    lines.push('-'.repeat(40));
    Object.entries(this.logData.calculations.priceData).forEach(([ticker, dates]) => {
      const dateCount = Object.keys(dates).length;
      const priceRange = Object.values(dates);
      const minPrice = Math.min(...priceRange);
      const maxPrice = Math.max(...priceRange);
      lines.push(`${ticker}: ${dateCount} price points, Range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
    });
    lines.push('');

    // Cumulative P&L Data
    lines.push('CUMULATIVE P&L CHART DATA');
    lines.push('-'.repeat(40));
    lines.push(`Total Data Points: ${this.logData.processedData.cumulativePnLData.length}`);
    lines.push('');

    // Show ALL data points without omission
    this.logData.processedData.cumulativePnLData.forEach((point, i) => {
      const prevPoint = i > 0 ? this.logData.processedData.cumulativePnLData[i - 1] : null;
      const change = prevPoint ? point.value - prevPoint.value : 0;
      const changeStr = prevPoint ? ` (${change >= 0 ? '+' : ''}$${change.toFixed(2)})` : '';
      lines.push(`${(i + 1).toString().padStart(3, ' ')}. ${point.date}: $${point.value.toFixed(2)}${changeStr}`);
    });
    lines.push('');

    // P&L Analysis - Identify largest changes
    lines.push('P&L CHANGE ANALYSIS');
    lines.push('-'.repeat(40));
    const changes: Array<{ date: string; change: number; value: number }> = [];
    for (let i = 1; i < this.logData.processedData.cumulativePnLData.length; i++) {
      const current = this.logData.processedData.cumulativePnLData[i];
      const previous = this.logData.processedData.cumulativePnLData[i - 1];
      changes.push({
        date: current.date,
        change: current.value - previous.value,
        value: current.value,
      });
    }

    // Sort by largest absolute changes
    const significantChanges = changes
      .filter(c => Math.abs(c.change) > 500) // Changes greater than $500
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    lines.push(`Significant Changes (>$500): ${significantChanges.length}`);
    significantChanges.slice(0, 20).forEach((change, i) => {
      const sign = change.change >= 0 ? '+' : '';
      lines.push(
        `${(i + 1).toString().padStart(3, ' ')}. ${change.date}: ${sign}$${change.change.toFixed(
          2,
        )} (Total: $${change.value.toFixed(2)})`,
      );
    });
    lines.push('');

    // Trading Statistics
    if (this.logData.processedData.tradingStats) {
      lines.push('TRADING STATISTICS (CLOSED POSITIONS)');
      lines.push('-'.repeat(40));
      const stats = this.logData.processedData.tradingStats;
      lines.push(`Total Closed Positions: ${stats.totalTrades}`);
      lines.push(`Winning Positions: ${stats.winningTrades} (${stats.winRate.toFixed(1)}%)`);
      lines.push(`Losing Positions: ${stats.losingTrades} (${(100 - stats.winRate).toFixed(1)}%)`);
      lines.push(`Total P&L (Closed): $${stats.totalPnL.toFixed(2)}`);
      lines.push(`Average Trade P&L: $${stats.averageTradePnL.toFixed(2)}`);
      lines.push(`Average Winning Trade: $${stats.averageWin.toFixed(2)}`);
      lines.push(`Average Losing Trade: $${stats.averageLoss.toFixed(2)}`);
      lines.push(`Largest Gain: $${stats.largestWin.toFixed(2)}`);
      lines.push(`Largest Loss: $${stats.largestLoss.toFixed(2)}`);
      lines.push('');
    }

    // Total Invested
    if (this.logData.processedData.totalInvested !== null) {
      lines.push('INVESTMENT SUMMARY');
      lines.push('-'.repeat(40));
      lines.push(`Total Amount Invested: $${this.logData.processedData.totalInvested.toFixed(2)}`);
      lines.push('');
    }

    // Monthly Performance
    if (this.logData.processedData.monthlyPerformance) {
      lines.push('MONTHLY PERFORMANCE SUMMARY');
      lines.push('-'.repeat(40));
      this.logData.processedData.monthlyPerformance.forEach(month => {
        lines.push(`${month.month}:`);
        lines.push(`  Trades: ${month.trades}`);
        lines.push(`  P&L: $${month.pnl.toFixed(2)}`);
        lines.push('');
      });
    }

    // Errors
    if (this.logData.errors.length > 0) {
      lines.push('ERRORS ENCOUNTERED');
      lines.push('-'.repeat(40));
      this.logData.errors.forEach((error, i) => {
        lines.push(`${i + 1}. [${error.timestamp}] ${error.context}: ${error.error}`);
      });
      lines.push('');
    }

    // Monthly Calculations Details
    lines.push('DETAILED MONTHLY CALCULATIONS');
    lines.push('-'.repeat(40));
    this.logData.calculations.monthlyCalculations.forEach(calc => {
      lines.push(`${calc.month}:`);
      lines.push(`  Calculation: ${JSON.stringify(calc.calculation, null, 2)}`);
      lines.push('');
    });

    lines.push('='.repeat(80));
    lines.push('END OF LOG');
    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}

// Export singleton instance
export const dataLogger = new DataLogger();
