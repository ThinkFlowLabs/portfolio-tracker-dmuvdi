import { useEffect, useState } from 'react';
import { Trade } from '@/types/trade';
import { 
  calculateCumulativePnL, 
  calculateStats, 
  calculateMonthlyPerformance,
  parseCsvTrades 
} from '@/lib/tradeCalculations';
import { CumulativePnLChart } from '@/components/portfolio/CumulativePnLChart';
import { StatsGrid } from '@/components/portfolio/StatsGrid';
import { MonthlyCharts } from '@/components/portfolio/MonthlyCharts';
import { TradesTable } from '@/components/portfolio/TradesTable';
import { AddTradeDialog } from '@/components/portfolio/AddTradeDialog';
import { TrendingUp } from 'lucide-react';

const Index = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrades = async () => {
      try {
        // Check if we have saved trades in localStorage
        const savedTrades = localStorage.getItem('portfolio-trades');
        if (savedTrades) {
          setTrades(JSON.parse(savedTrades));
        } else {
          // Load initial CSV data
          const response = await fetch('/src/data/portfolio_trades.csv');
          const csvText = await response.text();
          const parsedTrades = parseCsvTrades(csvText);
          setTrades(parsedTrades);
          localStorage.setItem('portfolio-trades', JSON.stringify(parsedTrades));
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  const cumulativePnL = calculateCumulativePnL(trades);
  const stats = calculateStats(trades);
  const monthlyPerformance = calculateMonthlyPerformance(trades);
  const currentPnL = cumulativePnL.length > 0 ? cumulativePnL[cumulativePnL.length - 1].value : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-success/20 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Portfolio Tracker</h1>
                <p className="text-muted-foreground text-sm">Real-time trading performance dashboard</p>
              </div>
            </div>
            <AddTradeDialog onAddTrade={handleAddTrade} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Cumulative P&L Chart - Hero Section */}
        <CumulativePnLChart data={cumulativePnL} currentPnL={currentPnL} />

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Monthly Charts */}
        <MonthlyCharts data={monthlyPerformance} />

        {/* Trades Table */}
        <TradesTable trades={trades} />
      </main>
    </div>
  );
};

export default Index;
