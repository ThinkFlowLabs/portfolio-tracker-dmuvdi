import { Card, CardContent } from '@/components/ui/card';
import { TradeStats } from '@/types/trade';

interface StatsGridProps {
  stats: TradeStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const statItems = [
    { label: 'Total Gain/Loss (Closed Positions)', value: formatCurrency(stats.totalPnL), isMain: true },
    { label: 'Largest Gain (Closed)', value: formatCurrency(stats.largestWin), positive: true },
    { label: 'Largest Loss (Closed)', value: formatCurrency(stats.largestLoss), negative: true },

    { label: 'Average Closed Position P&L', value: formatCurrency(stats.averageTradePnL) },
    { label: 'Average Winning Position', value: formatCurrency(stats.averageWin), positive: true },
    { label: 'Average Losing Position', value: formatCurrency(stats.averageLoss), negative: true },

    { label: 'Total Closed Positions', value: stats.totalTrades.toString() },
    { label: 'Winning Positions', value: `${stats.winningTrades} (${formatPercent(stats.winRate)})`, positive: true },
    {
      label: 'Losing Positions',
      value: `${stats.losingTrades} (${formatPercent(100 - stats.winRate)})`,
      negative: true,
    },
  ];

  return (
    <Card className="border-border bg-card premium-card shadow-premium overflow-hidden">
      <div className="border-b border-border/50 bg-gradient-to-r from-card to-secondary/20 px-6 py-4">
        <h3 className="text-lg font-bold text-foreground">📊 Estadísticas de Trading</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Basadas en posiciones cerradas • Incluye todo el historial de trading
        </p>
      </div>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {statItems.map((item, index) => (
            <div
              key={index}
              className={`
                group relative p-6 border-border transition-all duration-300
                hover:bg-gradient-to-br hover:from-card hover:to-secondary/30
                ${index % 3 !== 2 ? 'md:border-r' : ''}
                ${index < 6 ? 'border-b' : ''}
              `}>
              <div className="relative z-10">
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2 font-medium">
                  {item.label}
                </div>
                <div
                  className={`
                  font-bold transition-all duration-300
                  ${item.isMain ? 'text-2xl' : 'text-xl'}
                  ${item.positive ? 'text-success group-hover:glow-success' : ''}
                  ${item.negative ? 'text-destructive group-hover:glow-destructive' : ''}
                  ${!item.positive && !item.negative && !item.isMain ? 'text-foreground' : ''}
                `}>
                  {item.value}
                </div>
              </div>
              {/* Subtle gradient overlay on hover */}
              <div
                className={`
                absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                ${item.positive ? 'bg-gradient-to-br from-success/5 to-transparent' : ''}
                ${item.negative ? 'bg-gradient-to-br from-destructive/5 to-transparent' : ''}
              `}></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
