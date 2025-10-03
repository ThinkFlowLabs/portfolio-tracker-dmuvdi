import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CumulativePnLPoint } from '@/types/trade';

interface CumulativePnLChartProps {
  data: CumulativePnLPoint[];
  currentPnL: number;
  totalInvested: number;
}

export function CumulativePnLChart({ data, currentPnL, totalInvested }: CumulativePnLChartProps) {
  const [viewMode, setViewMode] = useState<'absolute' | 'percentage'>('absolute');
  const STARTING_EQUITY = 10000;

  const formatCurrency = (value: number) => {
    return `USD $${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const currentPnLPercentage = totalInvested > 0 ? (currentPnL / totalInvested) * 100 : 0;
  // Add starting point and convert data based on view mode
  const chartData =
    viewMode === 'absolute'
      ? [
          { date: 'Start', value: STARTING_EQUITY },
          ...data.map(point => ({
            date: point.date,
            value: STARTING_EQUITY + point.value,
          })),
        ]
      : [
          { date: 'Start', value: 0 },
          ...data.map(point => ({
            date: point.date,
            value: totalInvested > 0 ? (point.value / totalInvested) * 100 : 0,
          })),
        ];

  const displayValue =
    viewMode === 'absolute' ? formatCurrency(STARTING_EQUITY + currentPnL) : formatPercentage(currentPnLPercentage);

  return (
    <Card className="border-border bg-card premium-card shadow-premium overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="text-sm uppercase tracking-wider font-semibold text-muted-foreground">
              📈 P&L Total del Portafolio (Posiciones Abiertas + Cerradas)
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50 backdrop-blur-sm">
                <button
                  onClick={() => setViewMode('absolute')}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
                    viewMode === 'absolute'
                      ? 'bg-success/20 text-success shadow-md border border-success/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}>
                  USD
                </button>
                <button
                  onClick={() => setViewMode('percentage')}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
                    viewMode === 'percentage'
                      ? 'bg-success/20 text-success shadow-md border border-success/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}>
                  %
                </button>
              </div>
              <span
                className={`text-3xl font-bold tracking-tight transition-all duration-300 ${
                  currentPnL >= 0 ? 'text-success glow-success' : 'text-destructive glow-destructive'
                }`}>
                {displayValue}
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={formatDate}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={viewMode === 'absolute' ? formatCurrency : formatPercentage}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                color: 'hsl(var(--foreground))',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                padding: '12px 16px',
              }}
              formatter={(value: number) => [
                viewMode === 'absolute' ? formatCurrency(value) : formatPercentage(value),
                'P&L',
              ]}
              labelFormatter={formatDate}
              cursor={{ stroke: 'hsl(var(--success))', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Area type="monotone" dataKey="value" stroke="none" fill="url(#colorPnL)" animationDuration={1500} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: 'hsl(var(--success))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 3,
                filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))',
              }}
              animationDuration={1500}
              filter="drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
