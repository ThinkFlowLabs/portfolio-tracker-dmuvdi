import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade } from '@/types/trade';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TradesTableProps {
  trades: Trade[];
}

type SortField = 'date' | 'symbol' | 'quantity' | 'price' | 'pnl';
type SortDirection = 'asc' | 'desc';

export function TradesTable({ trades }: TradesTableProps) {
  const [sortField, setSortField] = useState<SortField>('pnl');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatCurrency = (value: number) => {
    return `USD $${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'pnl' ? 'desc' : 'asc');
    }
  };

  const sortedTrades = [...trades].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'date':
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol);
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'pnl':
        const pnlA = a.pnl ?? -Infinity;
        const pnlB = b.pnl ?? -Infinity;
        comparison = pnlA - pnlB;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  return (
    <Card className="border-border bg-card premium-card shadow-premium overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wider font-semibold text-muted-foreground">
          All Trades ({sortedTrades.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-secondary/30">
                <TableHead
                  className="text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-success transition-all duration-300"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center font-semibold">
                    Date
                    <SortIcon field="date" />
                  </div>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Time
                </TableHead>
                <TableHead
                  className="text-xs uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-success transition-all duration-300"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center font-semibold">
                    Symbol
                    <SortIcon field="symbol" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs uppercase tracking-wider text-muted-foreground text-right cursor-pointer select-none hover:text-success transition-all duration-300"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end font-semibold">
                    Quantity
                    <SortIcon field="quantity" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs uppercase tracking-wider text-muted-foreground text-right cursor-pointer select-none hover:text-success transition-all duration-300"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end font-semibold">
                    Price
                    <SortIcon field="price" />
                  </div>
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Side
                </TableHead>
                <TableHead
                  className="text-xs uppercase tracking-wider text-muted-foreground text-right cursor-pointer select-none hover:text-success transition-all duration-300"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center justify-end font-semibold">
                    P&L
                    <SortIcon field="pnl" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTrades.map((trade, index) => (
                <TableRow
                  key={trade.id}
                  className={`
                    border-border transition-all duration-300 striped-row
                    hover:bg-gradient-to-r hover:from-secondary/40 hover:to-transparent
                    hover:shadow-md hover:scale-[1.01] hover:z-10
                  `}
                >
                  <TableCell className="text-foreground font-medium">{trade.date}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{trade.time}</TableCell>
                  <TableCell className="text-foreground font-bold">
                    <span className="px-2 py-1 bg-gradient-to-r from-secondary to-secondary/50 rounded">
                      {trade.symbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground text-right font-mono text-sm">
                    {trade.quantity.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-foreground text-right font-semibold">
                    {formatCurrency(trade.price)}
                  </TableCell>
                  <TableCell>
                    <span className={`
                      px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide
                      transition-all duration-300 inline-block
                      ${trade.side === 'Compra'
                        ? 'bg-gradient-to-r from-success/20 to-success/10 text-success border border-success/30'
                        : 'bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive border border-destructive/30'
                      }
                    `}>
                      {trade.side}
                    </span>
                  </TableCell>
                  <TableCell className={`
                    text-right font-bold text-base transition-all duration-300
                    ${trade.pnl === undefined ? 'text-muted-foreground' :
                      trade.pnl > 0 ? 'text-success' :
                      trade.pnl < 0 ? 'text-destructive' :
                      'text-muted-foreground'
                    }
                  `}>
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
