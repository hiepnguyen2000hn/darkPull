"use client";

import { useState, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTokens } from '@/hooks/useTokens';
import { useZenigmaAddress } from '@/hooks/useWalletKeys';
import { getAvailableERC20Tokens } from '@/lib/constants';
import { TokenIconBySymbol } from './TokenSelector';
import DepositModal from './DepositModal';
import { X, ChevronRight, ChevronUp, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import * as Popover from '@radix-ui/react-popover';

/**
 * Portfolio Sidebar Component - Full Height
 *
 * Displays:
 * - Token list with balances
 * - Deposit button
 * - Fixed position, full height from top
 */
interface PortfolioSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const PortfolioSidebar = ({ isOpen, onClose }: PortfolioSidebarProps) => {
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    // Get Privy wallet address
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const privyWalletAddress = wallets.find(wallet => wallet.connectorType === 'embedded')?.address || user?.wallet?.address;

    // Get pk_root (Zenigma wallet address) - reactive via Jotai atom
    const zenigmaAddress = useZenigmaAddress();

    // Helper function to format address
    const formatAddress = (addr: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Copy address to clipboard
    const handleCopyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        toast.success('Address copied!');
    };

    // View on explorer
    const handleViewExplorer = (address: string, type: 'zenigma' | 'sepolia') => {
        const explorerUrl = type === 'sepolia'
            ? `https://sepolia.etherscan.io/address/${address}`
            : `https://sepolia.etherscan.io/address/${address}`;
        window.open(explorerUrl, '_blank');
    };

    // Get user profile data (contains available_balances array)
    const { profile, loading: profileLoading } = useUserProfile();

    // Get all tokens from API
    const { tokens: apiTokens, isLoading: tokensLoading } = useTokens();

    // Get ERC20 tokens config for icons
    const erc20TokensConfig = getAvailableERC20Tokens();

    // Combine token data with balances
    const tokenBalances = useMemo(() => {
        if (!profile || !apiTokens || apiTokens.length === 0) return [];

        return apiTokens.map((token) => {
            // ✅ FIXED: Use token.index (tokenIndex from API) instead of array index
            const balance = profile.available_balances?.[token.index] || '0';

            // Get icon from ERC20_TOKENS config
            const tokenConfig = erc20TokensConfig.find(t => t.symbol === token.symbol);

            return {
                ...token,
                balance,
                icon: tokenConfig?.icon,
            };
        });
    }, [profile, apiTokens, erc20TokensConfig]);

    // Calculate total portfolio value (assume 1:1 USD for stablecoins)
    const totalPortfolioValue = useMemo(() => {
        if (!tokenBalances || tokenBalances.length === 0) return 0;

        return tokenBalances.reduce((total, token) => {
            const balance = parseFloat(token.balance);
            // For demo, assume all tokens are worth $1 each
            // In production, multiply by token price
            return total + balance;
        }, 0);
    }, [tokenBalances]);

    const isLoading = profileLoading || tokensLoading;

    return (
        <>
            {/* Sidebar - Push Layout with framer-motion */}
            <motion.aside
                initial={false}
                animate={{
                    width: isOpen ? 280 : 0, // 280px - Compact portfolio
                    borderLeftWidth: isOpen ? 1 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                }}
                className="bg-black border-l border-gray-800 flex flex-col flex-shrink-0 overflow-hidden"
            >
                {/* Inner wrapper to maintain width */}
                <div className="w-[280px] flex flex-col h-full">
                    {/* Wallet Cards Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        transition={{ delay: isOpen ? 0.1 : 0 }}
                        className="p-3 space-y-2"
                    >
                        {/* Zenigma Wallet Card */}
                        <Popover.Root>
                            <Popover.Trigger asChild>
                                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer data-[state=open]:border-gray-600">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">Z</span>
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm">Zenigma Wallet</div>
                                            <div className="text-gray-500 text-xs">
                                                {zenigmaAddress ? formatAddress(zenigmaAddress) : 'Not connected'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col text-gray-500">
                                        <ChevronUp size={14} />
                                        <ChevronDown size={14} className="-mt-1" />
                                    </div>
                                </div>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    side="left"
                                    sideOffset={8}
                                    className="w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[9999] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                                >
                                    {zenigmaAddress && (
                                        <>
                                            {/* Full Address */}
                                            <div className="p-3 border-b border-gray-800">
                                                <div className="text-gray-400 text-xs font-mono break-all">
                                                    {zenigmaAddress}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="py-1">
                                                <Popover.Close asChild>
                                                    <button
                                                        onClick={() => handleCopyAddress(zenigmaAddress)}
                                                        className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-800 transition-colors outline-none"
                                                    >
                                                        <Copy size={16} className="text-gray-400" />
                                                        <span className="text-white text-sm">Copy Address</span>
                                                    </button>
                                                </Popover.Close>
                                                <Popover.Close asChild>
                                                    <button
                                                        onClick={() => handleViewExplorer(zenigmaAddress, 'zenigma')}
                                                        className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-800 transition-colors outline-none"
                                                    >
                                                        <ExternalLink size={16} className="text-gray-400" />
                                                        <span className="text-white text-sm">View on Explorer</span>
                                                    </button>
                                                </Popover.Close>
                                                <Popover.Close asChild>
                                                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-800 transition-colors outline-none">
                                                        <X size={16} className="text-gray-400" />
                                                        <span className="text-white text-sm">Disconnect</span>
                                                    </button>
                                                </Popover.Close>
                                            </div>
                                        </>
                                    )}
                                    <Popover.Arrow className="fill-gray-700" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>

                        {/* Sepolia Wallet Card */}
                        <Popover.Root>
                            <Popover.Trigger asChild>
                                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer data-[state=open]:border-gray-600">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-lg bg-[#213147] flex items-center justify-center overflow-hidden">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#28A0F0"/>
                                                <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="#96BEDC"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm">Sepolia Wallet</div>
                                            <div className="text-gray-500 text-xs">
                                                {privyWalletAddress ? formatAddress(privyWalletAddress) : 'Not connected'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col text-gray-500">
                                        <ChevronUp size={14} />
                                        <ChevronDown size={14} className="-mt-1" />
                                    </div>
                                </div>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    side="left"
                                    sideOffset={8}
                                    className="w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[9999] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                                >
                                    {privyWalletAddress && (
                                        <>
                                            {/* Full Address */}
                                            <div className="p-3 border-b border-gray-800">
                                                <div className="text-gray-400 text-xs font-mono break-all">
                                                    {privyWalletAddress}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="py-1">
                                                <Popover.Close asChild>
                                                    <button
                                                        onClick={() => handleCopyAddress(privyWalletAddress)}
                                                        className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-800 transition-colors outline-none"
                                                    >
                                                        <Copy size={16} className="text-gray-400" />
                                                        <span className="text-white text-sm">Copy Address</span>
                                                    </button>
                                                </Popover.Close>
                                                <Popover.Close asChild>
                                                    <button
                                                        onClick={() => handleViewExplorer(privyWalletAddress, 'sepolia')}
                                                        className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-800 transition-colors outline-none"
                                                    >
                                                        <ExternalLink size={16} className="text-gray-400" />
                                                        <span className="text-white text-sm">View on Explorer</span>
                                                    </button>
                                                </Popover.Close>
                                                <Popover.Close asChild>
                                                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-800 transition-colors outline-none">
                                                        <X size={16} className="text-gray-400" />
                                                        <span className="text-white text-sm">Disconnect</span>
                                                    </button>
                                                </Popover.Close>
                                            </div>
                                        </>
                                    )}
                                    <Popover.Arrow className="fill-gray-700" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </motion.div>

                    {/* Assets Header */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        transition={{ delay: isOpen ? 0.15 : 0 }}
                        className="flex items-center justify-between px-3 py-2"
                    >
                        <h2 className="text-base font-semibold text-white">Assets</h2>
                        <div className="flex items-center space-x-1 text-white cursor-pointer hover:text-gray-300 transition-colors">
                            <span className="text-sm font-medium">${totalPortfolioValue.toFixed(2)}</span>
                            <ChevronRight size={16} />
                        </div>
                    </motion.div>

                    {/* Token List - No Scroll */}
                    <div className="flex-1 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isOpen ? 1 : 0 }}
                            transition={{ delay: isOpen ? 0.2 : 0 }}
                            className="px-3 space-y-1.5"
                        >
                            {isLoading ? (
                            // Loading skeleton - Compact
                            <>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 20 }}
                                        transition={{ delay: isOpen ? 0.05 * i : 0 }}
                                        className="p-2 bg-gray-900/50 rounded-lg animate-pulse"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-7 h-7 bg-gray-800 rounded-full"></div>
                                                <div className="h-3 w-10 bg-gray-800 rounded"></div>
                                            </div>
                                            <div className="h-3 w-12 bg-gray-800 rounded"></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        ) : tokenBalances.length === 0 ? (
                            // Empty state
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.9 }}
                                transition={{ delay: isOpen ? 0.2 : 0 }}
                                className="text-center py-12 text-gray-500"
                            >
                                <div className="text-4xl mb-4">💳</div>
                                <div className="text-sm">No tokens found</div>
                                <div className="text-xs mt-2">Deposit tokens to get started</div>
                            </motion.div>
                        ) : (
                            // Token list - Compact design without scroll
                            tokenBalances.map((token, index) => {
                                const balance = parseFloat(token.balance);
                                const hasBalance = balance > 0;

                                return (
                                    <motion.div
                                        key={token.symbol}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 20 }}
                                        transition={{
                                            delay: isOpen ? 0.1 + (index * 0.05) : 0,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25,
                                        }}
                                        className={`p-2 rounded-lg border transition-all duration-200 ${
                                            hasBalance
                                                ? 'bg-gray-900/50 border-gray-800 hover:border-teal-500/50'
                                                : 'bg-gray-900/20 border-gray-800/50 opacity-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            {/* Token Info */}
                                            <div className="flex items-center space-x-1.5">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center">
                                                    <TokenIconBySymbol symbol={token.symbol} size="sm" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold text-[11px]">
                                                        {token.symbol}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Balance */}
                                            <div className="text-right">
                                                <div className={`font-semibold text-[11px] ${hasBalance ? 'text-white' : 'text-gray-600'}`}>
                                                    {token.balance}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                            )}
                        </motion.div>
                    </div>

                    {/* Bridge & Deposit Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        transition={{ delay: isOpen ? 0.25 : 0 }}
                        className="mt-auto p-3 border-t border-gray-800"
                    >
                        <div className="text-gray-500 text-xs mb-3">Bridge & Deposit</div>
                        <button className="w-full flex items-center space-x-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                            <div className="text-left">
                                <div className="text-white text-sm font-medium">Connect Solana Wallet</div>
                                <div className="text-gray-500 text-xs">To bridge & deposit USDC</div>
                            </div>
                        </button>
                    </motion.div>

                </div>
            </motion.aside>
        </>
    );
};

export default PortfolioSidebar;
