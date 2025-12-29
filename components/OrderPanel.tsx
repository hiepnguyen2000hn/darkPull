'use client';

import { Filter, Circle } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { TokenIconBySymbol } from './TokenSelector';
import { useTokenMapping } from '@/hooks/useTokenMapping';
import { useState, useEffect } from 'react';
import { getOrderList, type Order } from '@/lib/services';
import { extractPrivyWalletId } from '@/lib/wallet-utils';

// Order status mapping
const ORDER_STATUS = {
    0: { label: 'Open', color: 'text-green-500', dotColor: 'text-green-500 fill-green-500' },
    1: { label: 'Partial', color: 'text-yellow-500', dotColor: 'text-yellow-500 fill-yellow-500' },
    2: { label: 'Filled', color: 'text-blue-500', dotColor: 'text-blue-500 fill-blue-500' },
    3: { label: 'Matched', color: 'text-purple-500', dotColor: 'text-purple-500 fill-purple-500' },
    4: { label: 'Cancelled', color: 'text-gray-500', dotColor: 'text-gray-500 fill-gray-500' },
    5: { label: 'Created', color: 'text-cyan-500', dotColor: 'text-cyan-500 fill-cyan-500' },
} as const;

// Order filter params interface
interface OrderFilters {
    status?: (number | string)[];  // ✅ Array of status values
    side?: number;
    token?: number;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
}

const OrderPanel = () => {
    const { authenticated, user } = usePrivy();
    const { getSymbol } = useTokenMapping();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Filter state với default status=["Created"], limit=4
    const [filters, setFiltersState] = useState<OrderFilters>({
        status: ['Created'],  // ✅ Array
        page: 1,
        limit: 4,
    });

    /**
     * ✅ Set filter function - update filters và trigger refetch
     * Có thể set 1 hoặc nhiều filters cùng lúc
     *
     * @example
     * setFilter({ status: [0] }) // Set status = Open only
     * setFilter({ status: [0, 1] }) // Set status = Open OR Partial
     * setFilter({ status: ['Created', 'Matching'] }) // Multiple string statuses
     * setFilter({ side: 0, token: 3 }) // Set side=Buy, token=BTC
     * setFilter({ from_date: '2025-01-01', to_date: '2025-12-31' })
     */
    const setFilter = (newFilters: Partial<OrderFilters>) => {
        setFiltersState((prev) => ({
            ...prev,
            ...newFilters,
            page: newFilters.page ?? 1, // Reset to page 1 when filters change (unless explicitly set)
        }));
    };

    // Fetch orders on mount and when filters/authenticated changes
    useEffect(() => {
        if (!authenticated || !user?.id) {
            setOrders([]);
            return;
        }

        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                // ✅ Extract wallet_id from Privy user ID
                const walletId = extractPrivyWalletId(user.id);
                console.log('🔍 Fetching orders with filters:', filters);
                console.log('  - Wallet ID:', walletId);

                const response = await getOrderList(walletId, filters);
                setOrders(response.data || []);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [authenticated, user?.id, filters]);

    const hasOrders = orders.length > 0;
    return (
        <div className="bg-black border-t border-gray-800">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
                <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2 text-sm">
                        <Filter className="w-4 h-4" />
                        <span className="text-white">Filters</span>
                    </button>

                    <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 rounded-lg text-sm border border-gray-700">
                            <Circle className="w-3 h-3 text-green-500 fill-green-500" />
                            <span className="text-white">Open</span>
                        </button>
                        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                            <Circle className="w-3 h-3" />
                            <span>Side</span>
                        </button>
                        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                            <Circle className="w-3 h-3" />
                            <span>Token</span>
                        </button>
                        <button className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                            Clear
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button className="text-sm text-gray-400 hover:text-white transition-colors">
                        Cancel all open orders
                    </button>
                    <button className="text-sm text-gray-400 hover:text-white transition-colors">
                        ∞
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-gray-800">
                        <th className="text-left px-6 py-3 text-gray-400 font-normal">Status</th>
                        <th className="text-left px-6 py-3 text-gray-400 font-normal">Side</th>
                        <th className="text-left px-6 py-3 text-gray-400 font-normal">Asset</th>
                        <th className="text-right px-6 py-3 text-gray-400 font-normal">
                            <div className="flex items-center justify-end space-x-1">
                                <span>Order Value</span>
                                <span className="text-xs">▲</span>
                            </div>
                        </th>
                        <th className="text-right px-6 py-3 text-gray-400 font-normal">
                            <div className="flex items-center justify-end space-x-1">
                                <span>Size</span>
                                <span className="text-xs">◇</span>
                            </div>
                        </th>
                        <th className="text-right px-6 py-3 text-gray-400 font-normal">Filled</th>
                        <th className="text-right px-6 py-3 text-gray-400 font-normal">
                            <div className="flex items-center justify-end space-x-1">
                                <span>Time</span>
                                <span className="text-xs">▼</span>
                            </div>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {!authenticated ? (
                        <tr>
                            <td colSpan={7} className="text-center py-20 text-gray-400">
                                Sign in to view your orders.
                            </td>
                        </tr>
                    ) : loading ? (
                        <tr>
                            <td colSpan={7} className="text-center py-20 text-gray-400">
                                Loading orders...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={7} className="text-center py-20 text-red-500">
                                Error: {error}
                            </td>
                        </tr>
                    ) : !hasOrders ? (
                        <tr>
                            <td colSpan={7} className="text-center py-20 text-gray-400">
                                No open orders.
                            </td>
                        </tr>
                    ) : (
                        orders.map((order, index) => {
                            // ✅ Get token symbol from asset index
                            const assetSymbol = getSymbol(order.asset);
                            const quoteSymbol = 'USDC'; // Default quote token (assume USDC for now)

                            const isBuy = order.side === 0;
                            const status = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS[0];

                            // Format time
                            const orderTime = new Date(order.time).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            });

                            // Calculate filled percentage
                            const filledPercent = order.filled > 0 ? ((order.filled / order.size) * 100).toFixed(0) : '0';

                            return (
                                <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <Circle className={`w-3 h-3 ${status.dotColor}`} />
                                            <span className={status.color}>{status.label}</span>
                                        </div>
                                    </td>

                                    {/* Side */}
                                    <td className="px-6 py-4">
                                        <span className={`font-medium ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                                            {isBuy ? 'Buy' : 'Sell'}
                                        </span>
                                    </td>

                                    {/* Asset */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <TokenIconBySymbol symbol={assetSymbol} size="sm" />
                                            <span className="text-white font-medium">
                                                {assetSymbol}/{quoteSymbol}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Order Value */}
                                    <td className="px-6 py-4 text-right text-white">
                                        {order.order_value.toFixed(2)} {quoteSymbol}
                                    </td>

                                    {/* Size */}
                                    <td className="px-6 py-4 text-right text-white">
                                        {order.size} {assetSymbol}
                                    </td>

                                    {/* Filled */}
                                    <td className="px-6 py-4 text-right">
                                        <span className={order.filled > 0 ? 'text-white' : 'text-gray-400'}>
                                            {filledPercent}%
                                        </span>
                                    </td>

                                    {/* Time */}
                                    <td className="px-6 py-4 text-right text-gray-400">
                                        {orderTime}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderPanel;
