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
    { label: 'Total Gain/Loss', value: formatCurrency(stats.totalPnL), isMain: true },
    { label: 'Largest Gain', value: formatCurrency(stats.largestWin), positive: true },
    { label: 'Largest Loss', value: formatCurrency(stats.largestLoss), negative: true },
    
    { label: 'Average Trade Gain/Loss', value: formatCurrency(stats.averageTradePnL) },
    { label: 'Average Winning Trade', value: formatCurrency(stats.averageWin), positive: true },
    { label: 'Average Losing Trade', value: formatCurrency(stats.averageLoss), negative: true },
    
    { label: 'Total Number of Trades', value: stats.totalTrades.toString() },
    { label: 'Number of Winning Trades', value: `${stats.winningTrades} (${formatPercent(stats.winRate)})`, positive: true },
    { label: 'Number of Losing Trades', value: `${stats.losingTrades} (${formatPercent(100 - stats.winRate)})`, negative: true },
  ];

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {statItems.map((item, index) => (
            <div 
              key={index}
              className={`
                p-4 border-border
                ${index % 3 !== 2 ? 'md:border-r' : ''}
                ${index < 6 ? 'border-b' : ''}
              `}
            >
              <div className="text-muted-foreground text-sm mb-1">{item.label}</div>
              <div className={`
                font-semibold text-lg
                ${item.isMain ? 'text-xl' : ''}
                ${item.positive ? 'text-success' : ''}
                ${item.negative ? 'text-destructive' : ''}
                ${!item.positive && !item.negative && !item.isMain ? 'text-foreground' : ''}
              `}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
