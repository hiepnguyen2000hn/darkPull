'use client';

import { ArrowLeftRight, Lock } from 'lucide-react';
import ConnectButton from './ConnectButton';
import TradingActionButton from './TradingActionButton';
import TokenSelector from './TokenSelector';
import { usePrivy } from "@privy-io/react-auth";
import { useAtomValue, useSetAtom } from 'jotai';
import { orderInputAtom, toggleOrderSideAtom } from '@/store/trading';
import { useState } from 'react';

interface SidebarProps {
    selectedCrypto: string;
    onCryptoChange: (crypto: string) => void;
}

const Sidebar = ({ selectedCrypto, onCryptoChange }: SidebarProps) => {
    const { authenticated } = usePrivy();
    const orderInput = useAtomValue(orderInputAtom);
    const toggleSide = useSetAtom(toggleOrderSideAtom);
    const [selectedToken, setSelectedToken] = useState('WBTC');
    return (
        <aside className="w-96 border-r border-gray-800 bg-black">
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-4">
                    <span className="text-orange-500">●</span>
                    <span>WBTC</span>
                    <span className="text-blue-500">●</span>
                    <span>USDC</span>
                    <span className="ml-auto">--</span>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                    <button
                        onClick={toggleSide}
                        className="flex-1 py-3 bg-white text-black rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
                    >
                        <span>{orderInput.side === 'buy' ? 'Buy' : 'Sell'}</span>
                        <ArrowLeftRight className="w-4 h-4" />
                    </button>

                    <TokenSelector
                        selectedToken={selectedToken}
                        onSelectToken={setSelectedToken}
                    />
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Amount</label>
                        <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 border border-gray-800">
                            <input
                                type="text"
                                placeholder="0.00"
                                className="bg-transparent flex-1 outline-none text-white"
                            />
                            <span className="text-white font-medium ml-2">WBTC</span>
                            <ArrowLeftRight className="w-4 h-4 text-gray-400 ml-2" />
                        </div>

                        <div className="flex items-center justify-between mt-2 px-1">
                            <button className="text-xs text-gray-400 hover:text-white">25%</button>
                            <button className="text-xs text-gray-400 hover:text-white">50%</button>
                            <button className="text-xs text-gray-400 hover:text-white">MAX</button>
                        </div>
                    </div>

                    {authenticated ? (
                        <TradingActionButton className="w-full py-4" />
                    ) : (
                        <ConnectButton className="w-full py-4" />
                    )}

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Type</span>
                            <span className="text-white">Midpoint</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Order Value</span>
                            <span className="text-white">--</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Fee</span>
                            <span className="text-white">--</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total Savings vs. Binance</span>
                            <span className="text-white">--</span>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2 text-xs text-gray-500 pt-4">
                        <Lock className="w-3 h-3 mt-0.5" />
                        <span>All orders are pre-trade and post-trade private.</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
