import { useEffect, useState } from 'react';
import { Trade, CumulativePnLPoint } from '@/types/trade';
import {
  calculateCumulativePnL,
  calculateMarkToMarketCumulativePnL,
  calculateStats,
  calculateMonthlyPerformance,
  calculateTotalInvested,
  parseFirebaseJson,
} from '@/lib/tradeCalculations';
import { CumulativePnLChart } from '@/components/portfolio/CumulativePnLChart';
import { StatsGrid } from '@/components/portfolio/StatsGrid';
import { MonthlyCharts } from '@/components/portfolio/MonthlyCharts';
import { TradesTable } from '@/components/portfolio/TradesTable';
import { AddTradeDialog } from '@/components/portfolio/AddTradeDialog';
import { TrendingUp } from 'lucide-react';
import { dataLogger } from '@/lib/dataLogger';

const Index = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [cumulativePnLData, setCumulativePnLData] = useState<CumulativePnLPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMarkToMarket, setLoadingMarkToMarket] = useState(false);
  const [progressData, setProgressData] = useState({ current: 0, total: 0, currentMonth: '' });

  useEffect(() => {
    const loadTrades = async () => {
      // Start logging session
      dataLogger.startSession();

      try {
        // Clear localStorage to force fresh load
        localStorage.removeItem('portfolio-trades');

        const [transactionPortfolioResponse, closedTransactionsResponse] = await Promise.all([
          fetch('/transaction_portfolio.json'),
          fetch('/closed_transactions.json'),
        ]);

        if (!transactionPortfolioResponse.ok || !closedTransactionsResponse.ok) {
          throw new Error('Failed to fetch JSON files');
        }

        const transactionPortfolioData = await transactionPortfolioResponse.json();
        const closedTransactionsData = await closedTransactionsResponse.json();

        // Log raw data
        dataLogger.logRawData(transactionPortfolioData, closedTransactionsData);

        const parsedTrades = parseFirebaseJson(transactionPortfolioData, closedTransactionsData);

        // Log parsed trades
        dataLogger.logParsedTrades(parsedTrades);

        setTrades(parsedTrades);
        localStorage.setItem('portfolio-trades', JSON.stringify(parsedTrades));

        // Calculate mark-to-market cumulative P&L
        setLoadingMarkToMarket(true);
        try {
          const markToMarketData = await calculateMarkToMarketCumulativePnL(
            transactionPortfolioData,
            closedTransactionsData,
            (current, total, currentMonth) => {
              setProgressData({ current, total, currentMonth });
            },
          );
          setCumulativePnLData(markToMarketData);

          // Log cumulative P&L data
          dataLogger.logCumulativePnL(markToMarketData);
        } catch (error) {
          console.error('Error calculating mark-to-market data:', error);
          dataLogger.logError(String(error), 'calculateMarkToMarketCumulativePnL');
          // Fallback to traditional calculation
          const fallbackData = calculateCumulativePnL(parsedTrades);
          setCumulativePnLData(fallbackData);
          dataLogger.logCumulativePnL(fallbackData);
        } finally {
          setLoadingMarkToMarket(false);
          setProgressData({ current: 0, total: 0, currentMonth: '' });
        }
      } catch (error) {
        console.error('Error loading trades:', error);
        dataLogger.logError(String(error), 'loadTrades');
      } finally {
        setLoading(false);

        // Finalize logging (sin generar archivo automáticamente)
        dataLogger.finalizeSummary();
        // await dataLogger.generateLogFile(); // PAUSADO: Descarga automática deshabilitada
      }
    };

    loadTrades();
  }, []);

  const handleAddTrade = (newTrade: Trade) => {
    const updatedTrades = [...trades, newTrade];
    setTrades(updatedTrades);
    localStorage.setItem('portfolio-trades', JSON.stringify(updatedTrades));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-success mx-auto pulse-glow"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-success/30 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground font-medium">
              {loadingMarkToMarket ? 'Calculando rendimiento histórico...' : 'Cargando datos del portafolio...'}
            </p>
            {loadingMarkToMarket && progressData.total > 0 && (
              <div className="space-y-2 w-64 mx-auto">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progressData.currentMonth}</span>
                  <span>
                    {progressData.current}/{progressData.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progressData.current / progressData.total) * 100}%` }}></div>
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {Math.round((progressData.current / progressData.total) * 100)}% completado
                </div>
              </div>
            )}
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-success rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-success rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats(trades);
  const monthlyPerformance = calculateMonthlyPerformance(trades);
  const totalInvested = calculateTotalInvested(trades);
  const currentPnL = cumulativePnLData.length > 0 ? cumulativePnLData[cumulativePnLData.length - 1].value : 0;

  // Log all calculated statistics to dataLogger
  dataLogger.logTradingStats(stats);
  dataLogger.logMonthlyPerformance(monthlyPerformance);
  dataLogger.logTotalInvested(totalInvested);

  // Create corrected stats using mark-to-market data
  const correctedStats = {
    ...stats,
    totalPnL: currentPnL, // Use corrected P&L from mark-to-market
  };

  return (
    <div className="min-h-screen">
      {/* Header with Glass-morphism */}
      <header className="border-b border-border/50 backdrop-blur-glass sticky top-0 z-50 shadow-premium">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 fade-in">
              <div className="flex items-center gap-3">
                <img
                  src="https://bitfin-app-reports.vercel.app/logo-32.png"
                  alt="Bitfin Logo"
                  className="w-8 h-8 rounded-lg shadow-lg"
                  onError={e => {
                    // Fallback al icono original si la imagen no carga
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div
                  className="bg-gradient-to-br from-success/30 to-success/10 p-3 rounded-xl border border-success/20 shadow-lg"
                  style={{ display: 'none' }}>
                  <TrendingUp className="h-7 w-7 text-success drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Portafolio Privado Daniel Muvdi</h1>
                <p className="text-muted-foreground text-sm font-medium mt-0.5">
                  <span className="text-success font-semibold">Bitfin</span> Panel de rendimiento de trading en tiempo
                  real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => dataLogger.generateLogFile()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-lg"
                title="Descargar log de cálculos (solo manual)">
                📊 Descargar Log
              </button>
              {/* <AddTradeDialog onAddTrade={handleAddTrade} /> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with staggered animations */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Cumulative P&L Chart - Hero Section */}
        <div className="fade-in" style={{ animationDelay: '100ms' }}>
          <CumulativePnLChart data={cumulativePnLData} currentPnL={currentPnL} totalInvested={totalInvested} />
        </div>

        {/* Stats Grid */}
        <div className="fade-in" style={{ animationDelay: '200ms' }}>
          <StatsGrid stats={correctedStats} />
        </div>

        {/* Monthly Charts */}
        <div className="fade-in" style={{ animationDelay: '300ms' }}>
          <MonthlyCharts data={monthlyPerformance} />
        </div>

        {/* Trades Table */}
        <div className="fade-in" style={{ animationDelay: '400ms' }}>
          <TradesTable trades={trades} />
        </div>
      </main>
    </div>
  );
};

export default Index;
