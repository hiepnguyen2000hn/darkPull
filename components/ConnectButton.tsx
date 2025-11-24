"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Wallet } from "lucide-react";
import { useEffect } from "react";

interface ConnectButtonProps {
    className?: string;
    onClick?: () => void;
}

const ConnectButton = ({ className = "", onClick }: ConnectButtonProps) => {
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();

    useEffect(() => {
        console.log("ConnectButton Debug:", { address, isConnected });
    }, [address, isConnected]);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
        open();
    };

    const formatAddress = (addr: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 4)}....${addr.slice(-4)}`;
    };

    if (isConnected && address) {
        return (
            <button
                onClick={handleClick}
                className={`flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors ${className}`}
            >
                <Wallet size={18} />
                <span className="text-sm">{formatAddress(address)}</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors ${className}`}
        >
            Connect Wallet
        </button>
    );
};

export default ConnectButton;