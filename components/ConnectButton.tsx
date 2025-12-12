"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Wallet } from "lucide-react";
import { useEffect } from "react";

interface ConnectButtonProps {
    className?: string;
    onClick?: () => void;
}

const ConnectButton = ({ className = "", onClick }: ConnectButtonProps) => {
    const { login, authenticated, user, exportWallet } = usePrivy();

    useEffect(() => {
        console.log("ConnectButton Debug:", { authenticated, user });
    }, [authenticated, user]);

    const handleClick = async() => {
        // console.log('test', exportWallet)
        // const wallet = await exportWallet();
        // console.log('wallet', wallet)
        if (onClick) {
            onClick();
        }
        if (!authenticated) {
            login();
        }
    };

    const formatAddress = (addr: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 4)}....${addr.slice(-4)}`;
    };

    const userAddress = user?.wallet?.address;

    if (authenticated && userAddress) {
        return (
            <button
                onClick={handleClick}
                className={`flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors ${className}`}
            >
                <Wallet size={18} />
                <span className="text-sm">{formatAddress(userAddress)}</span>
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
