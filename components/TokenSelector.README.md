# TokenSelector Component

## 🎯 Interactive Token Selector with Framer Motion

Component cho phép user chọn token với popup animation mượt mà.

## ✨ Features

✅ **Button hiển thị token đang chọn** - Icon + Symbol + Dropdown
✅ **Modal với Backdrop** - Blur background khi mở
✅ **Search functionality** - Tìm kiếm theo symbol hoặc name
✅ **Smooth animations** - Spring animations với Framer Motion
✅ **Hover effects** - Scale + background color transitions
✅ **Selected indicator** - Green dot cho token đang chọn
✅ **Auto-focus search** - Search input tự động focus
✅ **Click outside to close** - Click backdrop để đóng
✅ **Keyboard friendly** - Type để search ngay

## 🎨 Animations

### Button
- Hover: `border-gray-700 → border-gray-600`
- Smooth transition

### Modal Backdrop
```tsx
initial: { opacity: 0 }
animate: { opacity: 1 }
exit: { opacity: 0 }
duration: 0.2s
```

### Modal Content
```tsx
initial: { opacity: 0, scale: 0.95, y: 20 }
animate: { opacity: 1, scale: 1, y: 0 }
exit: { opacity: 0, scale: 0.95, y: 20 }
type: "spring"
duration: 0.4s
bounce: 0.3
```

### Token Items
```tsx
initial: { opacity: 0, x: -20 }
animate: { opacity: 1, x: 0 }
whileHover: { scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }
whileTap: { scale: 0.98 }
```

## 💻 Usage

### Basic
```tsx
import TokenSelector from './TokenSelector';

function Sidebar() {
  const [token, setToken] = useState('WBTC');

  return (
    <TokenSelector
      selectedToken={token}
      onSelectToken={setToken}
    />
  );
}
```

### With className
```tsx
<TokenSelector
  selectedToken={selectedToken}
  onSelectToken={setSelectedToken}
  className="w-full"
/>
```

## 🎯 Props

```tsx
interface TokenSelectorProps {
  selectedToken: string;           // Current selected token symbol
  onSelectToken: (token: string) => void;  // Callback when token selected
  className?: string;               // Additional Tailwind classes
}
```

## 🪙 Token List

```tsx
const TOKENS: Token[] = [
  { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "🟠", color: "text-orange-500" },
  { symbol: "ETH", name: "Ethereum", icon: "💎", color: "text-blue-500" },
  { symbol: "USDC", name: "USD Coin", icon: "💵", color: "text-blue-500" },
  { symbol: "USDT", name: "Tether", icon: "💚", color: "text-green-500" },
  { symbol: "BNB", name: "Binance Coin", icon: "🟡", color: "text-yellow-500" },
  { symbol: "SOL", name: "Solana", icon: "🌐", color: "text-purple-500" },
  { symbol: "MATIC", name: "Polygon", icon: "🔮", color: "text-purple-500" },
  { symbol: "AVAX", name: "Avalanche", icon: "🔺", color: "text-red-500" },
  { symbol: "LINK", name: "Chainlink", icon: "🔗", color: "text-blue-500" },
  { symbol: "UNI", name: "Uniswap", icon: "🦄", color: "text-pink-500" },
];
```

## 🔍 Search

Search works on:
- Token symbol (e.g., "BTC", "ETH")
- Token name (e.g., "Bitcoin", "Ethereum")
- Case insensitive

## 🎨 UI States

### Button (Closed)
```
┌────────────────┐
│ 🟠 WBTC   ▼   │
└────────────────┘
```

### Modal (Open)
```
╔════════════════════════════╗
║ Select Token          ✕    ║
╠════════════════════════════╣
║ 🔍 Search token...         ║
╠════════════════════════════╣
║ 🟠 WBTC                 ● ║ ← Selected
║    Wrapped Bitcoin         ║
║────────────────────────────║
║ 💎 ETH                    ║
║    Ethereum                ║
║────────────────────────────║
║ 💵 USDC                   ║
║    USD Coin                ║
╚════════════════════════════╝
```

## 🎬 Animation Flow

```
User clicks button
  ↓
Backdrop fades in (0.2s)
  ↓
Modal scales up + fades in (0.4s spring)
  ↓
Token items slide in from left
  ↓
Search input auto-focused
  ↓
User types → Items filter with animation
  ↓
User clicks token → Scale down effect
  ↓
Modal closes → Reverse animation
```

## 🔧 Customization

### Add more tokens
```tsx
const TOKENS: Token[] = [
  ...TOKENS,
  { symbol: "DOT", name: "Polkadot", icon: "⚫", color: "text-pink-500" },
];
```

### Change modal width
```tsx
className="fixed ... max-w-md" // Default
className="fixed ... max-w-lg" // Larger
```

### Change animation speed
```tsx
transition={{ duration: 0.4 }} // Default
transition={{ duration: 0.6 }} // Slower
```

## 📦 Dependencies

- `framer-motion` - Animations
- `lucide-react` - Icons (X, Search)

## 🎯 Integration with Sidebar

```tsx
const [selectedToken, setSelectedToken] = useState('WBTC');

<div className="flex items-center space-x-2">
  <button>Buy/Sell</button>
  <TokenSelector
    selectedToken={selectedToken}
    onSelectToken={setSelectedToken}
  />
</div>
```

## 🚀 Future Enhancements

- [ ] Add token images from CoinMarketCap
- [ ] Add token prices
- [ ] Add favorite tokens
- [ ] Add recent tokens
- [ ] Add network badges
- [ ] Keyboard navigation (Arrow keys)
- [ ] Virtual scrolling for large lists
- [ ] Loading states
- [ ] Error states
