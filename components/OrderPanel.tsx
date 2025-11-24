import { Filter, Circle } from 'lucide-react';

const OrderPanel = () => {
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
                    <tr>
                        <td colSpan={7} className="text-center py-20 text-gray-400">
                            Sign in to view your orders.
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderPanel;
