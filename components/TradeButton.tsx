"use client";

import { useAtomValue } from "jotai";
import { tradingPairAtom, orderInputAtom, canPlaceOrderAtom } from "@/store/trading";
import { useAppKitAccount } from "@reown/appkit/react";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface TradeButtonProps {
    className?: string;
    onClick?: () => void;
}

const TradeButton = ({ className = "", onClick }: TradeButtonProps) => {
    const { isConnected } = useAppKitAccount();
    const pair = useAtomValue(tradingPairAtom);
    const orderInput = useAtomValue(orderInputAtom);
    const canPlaceOrder = useAtomValue(canPlaceOrderAtom);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleClick = async () => {
        if (!isConnected || !canPlaceOrder) return;

        setIsProcessing(true);
        try {
            if (onClick) {
                await onClick();
            }
            // Add your trade execution logic here
            console.log("Executing trade:", {
                side: orderInput.side,
                amount: orderInput.amount,
                pair: pair.symbol,
            });
        } catch (error) {
            console.error("Trade error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // If not connected, this button shouldn't show (ConnectButton will show instead)
    if (!isConnected) {
        return null;
    }

    const isBuy = orderInput.side === "buy";
    const baseToken = pair.base;

    // Button text based on state
    const getButtonText = () => {
        if (isProcessing) return "Processing...";
        if (!canPlaceOrder) {
            if (!orderInput.amount || parseFloat(orderInput.amount) <= 0) {
                return `Enter Amount`;
            }
            return "Insufficient Balance";
        }
        return isBuy ? `Buy ${baseToken}` : `Sell ${baseToken}`;
    };

    // Icon based on side
    const Icon = isProcessing ? Loader2 : isBuy ? ArrowUpRight : ArrowDownRight;

    return (
        <button
            onClick={handleClick}
            disabled={!canPlaceOrder || isProcessing}
            className={`
                flex items-center justify-center space-x-2
                font-medium rounded-lg transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isBuy
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }
                ${className}
            `}
        >
            <Icon
                size={18}
                className={isProcessing ? "animate-spin" : ""}
            />
            <span>{getButtonText()}</span>
        </button>
    );
};

export default TradeButton;
