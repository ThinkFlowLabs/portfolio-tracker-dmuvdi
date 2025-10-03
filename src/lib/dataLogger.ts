import { Trade, CumulativePnLPoint } from '@/types/trade';

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
    console.log(`🔄 Parsed Trades:`, trades.length);
  }

  logMonthlyHistory(history: PortfolioHistory) {
    this.logData.processedData.monthlyHistory = history;
    console.log(`📅 Monthly History:`, {
      portfolio: history.portfolio,
      months: history.history.length,
    });
  }

  logCumulativePnL(data: CumulativePnLPoint[]) {
    this.logData.processedData.cumulativePnLData = data;
    console.log(`📈 Cumulative P&L Data:`, data.length, 'points');
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

    console.log(`🌐 API Call:`, { endpoint, duration: `${duration}ms` });
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

    console.log(`📋 Summary:`, this.logData.summary);
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

      console.log(`💾 Log file generated: portfolio-calculation-log-${this.logData.sessionId}.txt`);
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
    this.logData.processedData.cumulativePnLData.forEach((point, i) => {
      if (i < 10 || i >= this.logData.processedData.cumulativePnLData.length - 5) {
        lines.push(`${point.date}: $${point.value.toFixed(2)}`);
      } else if (i === 10) {
        lines.push('... (middle data points omitted) ...');
      }
    });
    lines.push('');

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
