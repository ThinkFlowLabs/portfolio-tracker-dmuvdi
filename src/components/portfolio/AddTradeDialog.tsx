import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Trade } from '@/types/trade';
import { toast } from 'sonner';

interface AddTradeDialogProps {
  onAddTrade: (trade: Trade) => void;
}

export function AddTradeDialog({ onAddTrade }: AddTradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    symbol: '',
    quantity: '',
    price: '',
    side: 'Compra' as 'Compra' | 'Cierre',
    commission: '0',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.quantity || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const trade: Trade = {
      id: `${formData.date}-${formData.time}-${formData.symbol}-${Date.now()}`,
      date: formData.date,
      time: formData.time,
      symbol: formData.symbol.toUpperCase(),
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      side: formData.side,
      commission: parseFloat(formData.commission),
    };

    onAddTrade(trade);
    toast.success('Trade added successfully');
    setOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      symbol: '',
      quantity: '',
      price: '',
      side: 'Compra',
      commission: '0',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-success hover:bg-success/90 text-success-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Add Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Trade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-secondary border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="bg-secondary border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              type="text"
              placeholder="e.g., AAPL"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.0001"
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="bg-secondary border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-secondary border-border"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <Select
                value={formData.side}
                onValueChange={(value) => setFormData({ ...formData, side: value as 'Compra' | 'Cierre' })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Compra">Buy (Compra)</SelectItem>
                  <SelectItem value="Cierre">Close (Cierre)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Commission</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-success hover:bg-success/90 text-success-foreground">
            Add Trade
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
