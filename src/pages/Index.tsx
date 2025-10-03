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

const Index = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [cumulativePnLData, setCumulativePnLData] = useState<CumulativePnLPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMarkToMarket, setLoadingMarkToMarket] = useState(false);
  const [progressData, setProgressData] = useState({ current: 0, total: 0, currentMonth: '' });

  useEffect(() => {
    const loadTrades = async () => {
      try {
        // Clear localStorage to force fresh load
        localStorage.removeItem('portfolio-trades');

        console.log('Loading JSON files...');

        const [transactionPortfolioResponse, closedTransactionsResponse] = await Promise.all([
          fetch('/transaction_portfolio.json'),
          fetch('/closed_transactions.json'),
        ]);

        console.log('Fetch responses:', transactionPortfolioResponse.status, closedTransactionsResponse.status);

        if (!transactionPortfolioResponse.ok || !closedTransactionsResponse.ok) {
          throw new Error('Failed to fetch JSON files');
        }

        const transactionPortfolioData = await transactionPortfolioResponse.json();
        const closedTransactionsData = await closedTransactionsResponse.json();

        console.log('Transaction portfolio count:', transactionPortfolioData.length);
        console.log('Closed transactions count:', closedTransactionsData.length);

        const parsedTrades = parseFirebaseJson(transactionPortfolioData, closedTransactionsData);

        console.log('Parsed trades count:', parsedTrades.length);
        console.log('First 3 trades:', parsedTrades.slice(0, 3));
        console.log('Last 3 trades:', parsedTrades.slice(-3));

        setTrades(parsedTrades);
        localStorage.setItem('portfolio-trades', JSON.stringify(parsedTrades));

        // Calculate mark-to-market cumulative P&L
        setLoadingMarkToMarket(true);
        try {
          console.log('Calculating mark-to-market data...');
          const markToMarketData = await calculateMarkToMarketCumulativePnL(
            transactionPortfolioData,
            closedTransactionsData,
          );
          setCumulativePnLData(markToMarketData);
          console.log('Mark-to-market data loaded:', markToMarketData.length, 'points');
        } catch (error) {
          console.error('Error calculating mark-to-market data:', error);
          // Fallback to traditional calculation
          const fallbackData = calculateCumulativePnL(parsedTrades);
          setCumulativePnLData(fallbackData);
        } finally {
          setLoadingMarkToMarket(false);
        }
      } catch (error) {
        console.error('Error loading trades:', error);
      } finally {
        setLoading(false);
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

  return (
    <div className="min-h-screen">
      {/* Header with Glass-morphism */}
      <header className="border-b border-border/50 backdrop-blur-glass sticky top-0 z-50 shadow-premium">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 fade-in">
              <div className="bg-gradient-to-br from-success/30 to-success/10 p-3 rounded-xl border border-success/20 shadow-lg">
                <TrendingUp className="h-7 w-7 text-success drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Portafolio Privado Daniel Muvdi</h1>
                <p className="text-muted-foreground text-sm font-medium mt-0.5">
                  Panel de rendimiento de trading en tiempo real
                </p>
              </div>
            </div>
            <AddTradeDialog onAddTrade={handleAddTrade} />
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
          <StatsGrid stats={stats} />
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
