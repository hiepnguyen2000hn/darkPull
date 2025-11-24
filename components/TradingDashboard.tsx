'use client';
import { useState, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { tradingPairAtom } from '@/store/trading';
import Header from './Header';
import Sidebar from './Sidebar';
import Chart from './Chart';
import OrderPanel from './OrderPanel';

interface TradingDashboardProps {
    pair?: string;
}

const TradingDashboard = ({ pair = 'btc-usdt' }: TradingDashboardProps) => {
    const [selectedCrypto, setSelectedCrypto] = useState('BTC');
    const [selectedPair, setSelectedPair] = useState(pair);
    const setTradingPair = useSetAtom(tradingPairAtom);

    // Update selectedPair when pair prop changes
    useEffect(() => {
        setSelectedPair(pair);
        // Extract crypto symbol from pair (e.g., 'btc-usdt' -> 'BTC')
        const [base, quote] = pair.split('-');
        const crypto = base.toUpperCase();
        setSelectedCrypto(crypto);

        // Update Jotai store
        setTradingPair({
            base: crypto,
            quote: quote.toUpperCase(),
            symbol: pair,
        });
    }, [pair, setTradingPair]);

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />

            <div className="flex">
                <Sidebar
                    selectedCrypto={selectedCrypto}
                    onCryptoChange={setSelectedCrypto}
                />

                <main className="flex-1 flex flex-col">
                    <Chart crypto={selectedCrypto} pair={selectedPair} />
                    <OrderPanel />
                </main>
            </div>
        </div>
    );
};

export default TradingDashboard;
