"use client";

import { useAtomValue } from "jotai";
import { tradingPairAtom, orderInputAtom } from "@/store/trading";

interface TradingActionButtonProps {
    className?: string;
    onClick?: () => void;
}

const TradingActionButton = ({ className = "", onClick }: TradingActionButtonProps) => {
    const pair = useAtomValue(tradingPairAtom);
    const orderInput = useAtomValue(orderInputAtom);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
        // Add your trade logic here
        console.log("Execute trade:", {
            side: orderInput.side,
            pair: pair.symbol,
        });
    };

    const action = orderInput.side === 'buy' ? 'Buy' : 'Sell';

    return (
        <button
            onClick={handleClick}
            className={`bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors ${className}`}
        >
            {action} {pair.base}
        </button>
    );
};

export default TradingActionButton;
