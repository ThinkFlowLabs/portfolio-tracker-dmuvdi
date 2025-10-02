import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade } from '@/types/trade';

interface TradesTableProps {
  trades: Trade[];
}

export function TradesTable({ trades }: TradesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  const displayTrades = sortedTrades.slice(0, 20);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Trades (Last 20)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Symbol</TableHead>
                <TableHead className="text-muted-foreground text-right">Quantity</TableHead>
                <TableHead className="text-muted-foreground text-right">Price</TableHead>
                <TableHead className="text-muted-foreground">Side</TableHead>
                <TableHead className="text-muted-foreground text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTrades.map((trade) => (
                <TableRow key={trade.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="text-foreground">{trade.date}</TableCell>
                  <TableCell className="text-foreground">{trade.time}</TableCell>
                  <TableCell className="text-foreground font-medium">{trade.symbol}</TableCell>
                  <TableCell className="text-foreground text-right">{trade.quantity.toFixed(4)}</TableCell>
                  <TableCell className="text-foreground text-right">{formatCurrency(trade.price)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.side === 'Compra' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {trade.side}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    trade.pnl === undefined ? 'text-muted-foreground' :
                    trade.pnl > 0 ? 'text-success' :
                    trade.pnl < 0 ? 'text-destructive' :
                    'text-muted-foreground'
                  }`}>
                    {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
