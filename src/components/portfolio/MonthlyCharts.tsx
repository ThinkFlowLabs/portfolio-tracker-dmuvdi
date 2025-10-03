import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyPerformance } from '@/types/trade';

interface MonthlyChartsProps {
  data: MonthlyPerformance[];
}

export function MonthlyCharts({ data }: MonthlyChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border bg-card premium-card shadow-premium overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider font-semibold text-muted-foreground">
            Trade Distribution by Month Open
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical">
              <defs>
                <linearGradient id="tradeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                type="category"
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={formatMonth}
                width={80}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  padding: '12px 16px',
                }}
                formatter={(value: number) => [value, 'Trades']}
                labelFormatter={formatMonth}
                cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
              />
              <Bar dataKey="trades" fill="url(#tradeGradient)" radius={[0, 8, 8, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card premium-card shadow-premium overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider font-semibold text-muted-foreground">
            Performance by Month Close
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical">
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={formatCurrency}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                type="category"
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={formatMonth}
                width={80}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  padding: '12px 16px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'P&L']}
                labelFormatter={formatMonth}
                cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
              />
              <Bar dataKey="pnl" radius={[0, 8, 8, 0]} animationDuration={1200}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'url(#profitGradient)' : 'url(#lossGradient)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
