# TradeButton Component

## 📦 Smart Trade Button with Store Integration

Component button thông minh tự động thay đổi theo trạng thái trading từ Jotai store.

## 🎯 Features

✅ **Auto Buy/Sell** - Tự động hiển thị "Buy BTC" hoặc "Sell BTC" theo `orderInput.side`
✅ **Smart Validation** - Kiểm tra balance, amount tự động từ `canPlaceOrderAtom`
✅ **Dynamic Colors** - Green cho Buy, Red cho Sell
✅ **Icons** - Arrow up/down icons theo side
✅ **Loading State** - Spinner khi đang process
✅ **Disabled State** - Tự động disable khi không đủ điều kiện
✅ **Error Messages** - "Insufficient Balance", "Enter Amount"
✅ **Style Props** - Nhận `className` để customize

## 🎨 UI States

### 1. **Not Connected** → Không hiển thị (ConnectButton sẽ show)

### 2. **Connected - No Amount**
```
┌──────────────────────────┐
│  🔼  Enter Amount         │ (Disabled)
└──────────────────────────┘
```

### 3. **Connected - Insufficient Balance**
```
┌──────────────────────────┐
│  🔼  Insufficient Balance │ (Disabled)
└──────────────────────────┘
```

### 4. **Connected - Valid (Buy)**
```
┌──────────────────────────┐
│  ↗  Buy BTC               │ (Green, Enabled)
└──────────────────────────┘
```

### 5. **Connected - Valid (Sell)**
```
┌──────────────────────────┐
│  ↘  Sell BTC              │ (Red, Enabled)
└──────────────────────────┘
```

### 6. **Processing**
```
┌──────────────────────────┐
│  ⟳  Processing...         │ (Spinner)
└──────────────────────────┘
```

## 💻 Usage

### Basic (Full Width in Sidebar)
```tsx
import TradeButton from './TradeButton';

function Sidebar() {
  const { isConnected } = useAppKitAccount();

  return (
    <>
      {isConnected ? (
        <TradeButton className="w-full py-4" />
      ) : (
        <ConnectButton className="w-full py-4" />
      )}
    </>
  );
}
```

### With Custom Handler
```tsx
<TradeButton
  className="w-full py-4"
  onClick={async () => {
    console.log("Custom trade logic");
    // Execute trade
    await executeTrade();
  }}
/>
```

### Compact Button
```tsx
<TradeButton className="px-6 py-2" />
```

## 🔗 Store Dependencies

Button tự động đọc từ store:

```tsx
tradingPairAtom        // { base: 'BTC', quote: 'USDT', symbol: 'btc-usdt' }
orderInputAtom         // { side: 'buy', amount: '0.5', ... }
canPlaceOrderAtom      // true/false (derived from balance + amount)
```

## 🎛️ Props

```tsx
interface TradeButtonProps {
  className?: string;      // Tailwind classes
  onClick?: () => void;    // Custom click handler
}
```

## 🔄 Flow

```
User clicks button
  ↓
Check: isConnected? → No → Nothing (shouldn't show)
  ↓
Check: canPlaceOrder? → No → Show error message
  ↓
Yes → Execute trade
  ↓
Set isProcessing = true
  ↓
Call onClick handler (if provided)
  ↓
Execute trade logic
  ↓
Set isProcessing = false
```

## 🎨 Color System

```tsx
Buy:  bg-green-500 hover:bg-green-600
Sell: bg-red-500 hover:bg-red-600

Disabled: opacity-50 cursor-not-allowed
```

## 🧩 Integration with Sidebar

```tsx
// Sidebar.tsx
{isConnected ? (
  <TradeButton className="w-full py-4" />
) : (
  <ConnectButton className="w-full py-4" />
)}
```

**Logic:**
- Not connected → Show `ConnectButton`
- Connected → Show `TradeButton`
- TradeButton tự động switch Buy/Sell theo `orderInputAtom.side`

## 📊 Store Integration Example

```tsx
// User changes side in another component
const toggleSide = useSetAtom(toggleOrderSideAtom);

<button onClick={toggleSide}>
  Switch to {orderInput.side === 'buy' ? 'Sell' : 'Buy'}
</button>

// TradeButton tự động update!
// Buy BTC → Sell BTC (và đổi màu green → red)
```

## 🚀 Advanced: Update Order Side from Buy/Sell Button

```tsx
// Add to Sidebar
const toggleSide = useSetAtom(toggleOrderSideAtom);

<div className="flex gap-2">
  <button
    onClick={() => toggleSide()}
    className={orderInput.side === 'buy' ? 'active' : ''}
  >
    Buy
  </button>
  <button
    onClick={() => toggleSide()}
    className={orderInput.side === 'sell' ? 'active' : ''}
  >
    Sell
  </button>
</div>

<TradeButton className="w-full py-4" />
// Button text/color auto-updates!
```

## ✨ Benefits

1. **Single Source of Truth** - All state from store
2. **Auto-Sync** - Changes anywhere → Button updates
3. **Clean Code** - No prop drilling
4. **Reusable** - Use anywhere with same logic
5. **Type-Safe** - Full TypeScript support

## 🎯 Next Steps

1. Add actual trade execution logic
2. Connect to smart contract
3. Show transaction confirmation modal
4. Update balances after trade
5. Add order to history
