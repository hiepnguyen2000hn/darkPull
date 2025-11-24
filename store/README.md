# Trading Store - Jotai State Management

## 📦 Store Structure

```
store/
└── trading.ts - Complete trading state management
```

## 🗂️ State Categories

### 1. **Trading Pair** (`tradingPairAtom`)
```tsx
{
  base: 'BTC',
  quote: 'USDT',
  symbol: 'btc-usdt'
}
```

### 2. **Order Input** (`orderInputAtom`)
```tsx
{
  amount: '0.5',
  side: 'buy' | 'sell',
  orderType: 'market' | 'limit' | 'midpoint',
  limitPrice: '98000',
  slippage: 0.5
}
```

### 3. **Price Data** (`priceDataAtom`)
```tsx
{
  currentPrice: 98765.43,
  open: 98500,
  high: 99000,
  low: 98200,
  close: 98765,
  change: 265.43,
  changePercent: 0.27,
  volume: 12345,
  lastUpdate: 1699999999
}
```

### 4. **User Balances** (`balancesAtom`)
```tsx
[
  { token: 'BTC', balance: 1.5, usdValue: 148148 },
  { token: 'USDT', balance: 50000, usdValue: 50000 }
]
```

### 5. **Order Calculation** (Derived - `orderCalculationAtom`)
```tsx
{
  orderValue: 49382.72,
  fee: 49.38,
  feePercent: 0.1,
  totalCost: 49432.10,
  estimatedReceived: 0.5,
  priceImpact: 0.004
}
```

### 6. **Orders** (`ordersAtom` - Persisted)
```tsx
[{
  id: 'order-xxx',
  pair: { base: 'BTC', quote: 'USDT' },
  side: 'buy',
  type: 'market',
  amount: 0.5,
  price: 98765,
  total: 49382,
  status: 'filled',
  timestamp: 1699999999,
  txHash: '0x...'
}]
```

### 7. **UI State** (`uiStateAtom`)
```tsx
{
  isOrderModalOpen: false,
  isConfirmingOrder: false,
  orderError: null,
  isLoadingPrice: false,
  isLoadingBalance: false
}
```

### 8. **Chart Settings** (`chartSettingsAtom` - Persisted)
```tsx
{
  timeframe: '1h',
  chartType: 'candlestick',
  indicators: ['MA', 'RSI']
}
```

## 🎯 Usage Examples

### Read State
```tsx
import { useAtom, useAtomValue } from 'jotai';
import { tradingPairAtom, orderInputAtom } from '@/store/trading';

function Component() {
  // Read only
  const pair = useAtomValue(tradingPairAtom);

  // Read & Write
  const [orderInput, setOrderInput] = useAtom(orderInputAtom);

  return <div>{pair.symbol}</div>;
}
```

### Write Actions
```tsx
import { useSetAtom } from 'jotai';
import { updateOrderAmountAtom, toggleOrderSideAtom } from '@/store/trading';

function OrderForm() {
  const updateAmount = useSetAtom(updateOrderAmountAtom);
  const toggleSide = useSetAtom(toggleOrderSideAtom);

  return (
    <>
      <input onChange={(e) => updateAmount(e.target.value)} />
      <button onClick={toggleSide}>Switch Buy/Sell</button>
    </>
  );
}
```

### Derived State
```tsx
import { useAtomValue } from 'jotai';
import { orderCalculationAtom, canPlaceOrderAtom } from '@/store/trading';

function OrderSummary() {
  const calc = useAtomValue(orderCalculationAtom);
  const canPlace = useAtomValue(canPlaceOrderAtom);

  return (
    <div>
      <p>Total: ${calc.totalCost}</p>
      <button disabled={!canPlace}>Place Order</button>
    </div>
  );
}
```

### Percentage Buttons
```tsx
import { useSetAtom } from 'jotai';
import { setPercentageAtom } from '@/store/trading';

function QuickSelect() {
  const setPercentage = useSetAtom(setPercentageAtom);

  return (
    <>
      <button onClick={() => setPercentage(25)}>25%</button>
      <button onClick={() => setPercentage(50)}>50%</button>
      <button onClick={() => setPercentage(100)}>MAX</button>
    </>
  );
}
```

### Update from WebSocket
```tsx
import { useSetAtom } from 'jotai';
import { priceDataAtom } from '@/store/trading';

function usePriceWebSocket() {
  const setPriceData = useSetAtom(priceDataAtom);

  useEffect(() => {
    // WebSocket update
    ws.onmessage = (data) => {
      setPriceData({
        currentPrice: data.close,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        change: data.close - data.open,
        changePercent: ((data.close - data.open) / data.open) * 100,
        volume: data.volume,
        lastUpdate: Date.now()
      });
    };
  }, []);
}
```

## 🔥 Advanced Features

### Persisted State
- `ordersAtom` - Orders saved to localStorage
- `chartSettingsAtom` - Chart preferences saved

### Atomic Updates
All state updates are atomic - no race conditions!

### Performance
- Only re-renders components using changed atoms
- Derived atoms auto-update
- No prop drilling needed

## 📚 Best Practices

1. **Read-only components**: Use `useAtomValue`
2. **Write-only actions**: Use `useSetAtom`
3. **Read + Write**: Use `useAtom`
4. **Derived state**: Create computed atoms
5. **Actions**: Use write-only atoms for complex logic

## 🎨 Integration with Existing Code

Replace component state with atoms:

**Before:**
```tsx
const [pair, setPair] = useState('btc-usdt');
const [amount, setAmount] = useState('');
```

**After:**
```tsx
const pair = useAtomValue(tradingPairAtom);
const updateAmount = useSetAtom(updateOrderAmountAtom);
```
