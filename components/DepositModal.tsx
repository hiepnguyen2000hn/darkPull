"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import Stepper, { Step } from './Stepper';
import { useUSDC } from '@/hooks/useUSDC';
import { DARKPOOL_CORE_ADDRESS } from '@/lib/constants';

interface Token {
    symbol: string;
    name: string;
    icon: string;
    balance: string;
}

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Token list will be updated with real balances in component

const NETWORKS = [
    { value: 'ethereum', label: 'Ethereum Mainnet' },
    { value: 'sepolia', label: 'Sepolia Testnet' },
    { value: 'arbitrum', label: 'Arbitrum One' },
    { value: 'optimism', label: 'Optimism' },
];

const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [selectedNetwork, setSelectedNetwork] = useState('sepolia');
    const [amount, setAmount] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [errorMessage, setErrorMessage] = useState('');

    // USDC hook for balance and approve
    const {
        balance: usdcBalance,
        isConnected,
        approve,
        isApprovePending,
        isApproveConfirming,
        isApproveSuccess,
        allowance,
        refetchAllowance,
        isLoadingBalance
    } = useUSDC(DARKPOOL_CORE_ADDRESS);

    if (!isOpen) return null;

    const handleClose = () => {
        setSelectedToken(null);
        setAmount('');
        setCurrentStep(1);
        setErrorMessage('');
        onClose();
    };

    const handleComplete = async () => {
        try {
            console.log('💰 Starting deposit process...', { selectedToken, selectedNetwork, amount });

            if (!isConnected) {
                alert('Please connect wallet first!');
                return;
            }

            if (!selectedToken || !amount) {
                alert('Missing required fields');
                return;
            }

            // Only approve USDC for now
            if (selectedToken.symbol === 'USDC') {
                console.log('💰 Current USDC Balance:', usdcBalance);
                console.log('📊 Current allowance:', allowance);

                const requiredAmount = parseFloat(amount);
                const currentAllowance = parseFloat(allowance);

                // Check if allowance is already sufficient
                if (currentAllowance >= requiredAmount) {
                    console.log(`✅ Allowance already sufficient! Current: ${currentAllowance} USDC, Required: ${requiredAmount} USDC`);
                    alert(`Deposit approved!\nAmount: ${amount} USDC\nAllowance already sufficient.`);
                    handleClose();
                    return;
                }

                // Need to approve
                console.log(`⚠️ Allowance insufficient! Current: ${currentAllowance} USDC, Required: ${requiredAmount} USDC`);
                console.log('🔐 Approving USDC to spender:', DARKPOOL_CORE_ADDRESS);

                await approve(DARKPOOL_CORE_ADDRESS, amount);

                console.log('✅ Approval transaction submitted!');
                alert(`USDC Approval submitted!\nAmount: ${amount} USDC\nPlease wait for confirmation...`);
            } else {
                console.log('ℹ️ Token not USDC, skipping approve for now');
                alert(`Deposit initiated for ${amount} ${selectedToken.symbol}`);
            }

            handleClose();
        } catch (error) {
            console.error('❌ Error in deposit process:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleStepChange = (step: number) => {
        setCurrentStep(step);
        setErrorMessage('');
    };

    // Validation logic for each step
    const getValidationForCurrentStep = (): { canProceed: boolean; errorMessage: string } => {
        switch (currentStep) {
            case 1:
                if (!selectedToken) {
                    return {
                        canProceed: false,
                        errorMessage: 'Please select a token to continue'
                    };
                }
                return { canProceed: true, errorMessage: '' };

            case 2:
                if (!amount || parseFloat(amount) <= 0) {
                    return {
                        canProceed: false,
                        errorMessage: 'Please enter a valid amount greater than 0'
                    };
                }

                // Check if amount exceeds balance (for USDC)
                if (selectedToken?.symbol === 'USDC') {
                    const enteredAmount = parseFloat(amount);
                    const availableBalance = parseFloat(usdcBalance);

                    if (enteredAmount > availableBalance) {
                        return {
                            canProceed: false,
                            errorMessage: `Insufficient balance. You have ${availableBalance} USDC`
                        };
                    }
                }

                return { canProceed: true, errorMessage: '' };

            case 3:
                return { canProceed: true, errorMessage: '' };

            default:
                return { canProceed: true, errorMessage: '' };
        }
    };

    const validation = getValidationForCurrentStep();

    // Build tokens list with real balance
    const TOKENS: Token[] = [
        { symbol: 'BTC', name: 'Bitcoin', icon: '₿', balance: '0.00' },
        { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', balance: '0.00' },
        { symbol: 'USDC', name: 'USD Coin', icon: '$', balance: usdcBalance },
        { symbol: 'USDT', name: 'Tether', icon: '₮', balance: '0.00' },
        { symbol: 'XRP', name: 'Ripple', icon: 'X', balance: '0.00' },
        { symbol: 'ZEC', name: 'Zcash', icon: 'Z', balance: '0.00' },
        { symbol: 'BNB', name: 'Binance Coin', icon: 'B', balance: '0.00' },
        { symbol: 'SOL', name: 'Solana', icon: 'S', balance: '0.00' },
        { symbol: 'ADA', name: 'Cardano', icon: 'A', balance: '0.00' },
        { symbol: 'DOGE', name: 'Dogecoin', icon: 'D', balance: '0.00' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl mx-4 bg-gradient-to-b from-gray-900 to-gray-900/95 border border-gray-700/70 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
                    <h2 className="text-xl font-bold text-white">Deposit Assets</h2>
                    <button
                        onClick={handleClose}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-5 py-4">
                    <Stepper
                        initialStep={1}
                        onStepChange={handleStepChange}
                        onFinalStepCompleted={handleComplete}
                        stepCircleContainerClassName="stepper-custom"
                        contentClassName="stepper-content"
                        footerClassName="stepper-footer"
                        backButtonText="Back"
                        nextButtonText="Next"
                        disableStepIndicators={false}
                        canProceed={validation.canProceed}
                        errorMessage={validation.errorMessage}
                    >
                        {/* Step 1: Select Token */}
                        <Step>
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold text-white/90 mt-1">Choose a token to deposit</h3>
                                <div className="max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-teal-500/50 scrollbar-track-gray-800/50 hover:scrollbar-thumb-teal-500/70 scroll-smooth">
                                    <div className="grid gap-2.5">
                                        {TOKENS.map((token) => {
                                            const getTokenColor = (symbol: string) => {
                                                const colors: Record<string, string> = {
                                                    'BTC': 'bg-gradient-to-br from-orange-500/30 to-orange-600/30 text-orange-400',
                                                    'ETH': 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 text-blue-400',
                                                    'USDC': 'bg-gradient-to-br from-blue-600/30 to-blue-700/30 text-blue-300',
                                                    'USDT': 'bg-gradient-to-br from-green-500/30 to-green-600/30 text-green-400',
                                                    'XRP': 'bg-gradient-to-br from-gray-500/30 to-gray-600/30 text-gray-300',
                                                    'ZEC': 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 text-yellow-400',
                                                    'BNB': 'bg-gradient-to-br from-yellow-400/30 to-yellow-500/30 text-yellow-300',
                                                    'SOL': 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 text-purple-400',
                                                    'ADA': 'bg-gradient-to-br from-blue-400/30 to-blue-500/30 text-blue-300',
                                                    'DOGE': 'bg-gradient-to-br from-yellow-600/30 to-yellow-700/30 text-yellow-500',
                                                };
                                                return colors[symbol] || 'bg-gradient-to-br from-gray-500/30 to-gray-600/30 text-gray-400';
                                            };

                                            return (
                                                <button
                                                    key={token.symbol}
                                                    onClick={() => setSelectedToken(token)}
                                                    className={`group w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                                                        selectedToken?.symbol === token.symbol
                                                            ? 'border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/20'
                                                            : 'border-gray-700/70 bg-gray-800/30 hover:border-teal-500/50 hover:bg-gray-800/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold transition-transform group-hover:scale-110 ${getTokenColor(token.symbol)}`}>
                                                            {token.icon}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-white font-semibold text-sm">{token.symbol}</div>
                                                            <div className="text-gray-400 text-xs">{token.name}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-gray-500 text-xs mb-0.5">Balance</div>
                                                        <div className="text-white/90 font-medium text-xs">{token.balance}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Step>

                        {/* Step 2: Network & Amount */}
                        <Step>
                            {selectedToken ? (
                                <div className="space-y-4">
                                    <h3 className="text-base font-semibold text-white/90">Enter deposit details</h3>

                                {/* Selected Token Display */}
                                <div className="p-3 bg-gradient-to-r from-teal-500/5 to-blue-500/5 border border-teal-500/30 rounded-lg flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                        selectedToken.symbol === 'BTC' ? 'bg-gradient-to-br from-orange-500/30 to-orange-600/30 text-orange-400' :
                                        selectedToken.symbol === 'ETH' ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 text-blue-400' :
                                        selectedToken.symbol === 'USDC' ? 'bg-gradient-to-br from-blue-600/30 to-blue-700/30 text-blue-300' :
                                        selectedToken.symbol === 'USDT' ? 'bg-gradient-to-br from-green-500/30 to-green-600/30 text-green-400' :
                                        selectedToken.symbol === 'XRP' ? 'bg-gradient-to-br from-gray-500/30 to-gray-600/30 text-gray-300' :
                                        selectedToken.symbol === 'ZEC' ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 text-yellow-400' :
                                        selectedToken.symbol === 'BNB' ? 'bg-gradient-to-br from-yellow-400/30 to-yellow-500/30 text-yellow-300' :
                                        selectedToken.symbol === 'SOL' ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 text-purple-400' :
                                        selectedToken.symbol === 'ADA' ? 'bg-gradient-to-br from-blue-400/30 to-blue-500/30 text-blue-300' :
                                        'bg-gradient-to-br from-yellow-600/30 to-yellow-700/30 text-yellow-500'
                                    }`}>
                                        {selectedToken.icon}
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold text-sm">{selectedToken.symbol}</div>
                                        <div className="text-gray-400 text-xs">{selectedToken.name}</div>
                                    </div>
                                </div>

                                {/* Network Selection */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-2">
                                        Network
                                    </label>
                                    <select
                                        value={selectedNetwork}
                                        onChange={(e) => setSelectedNetwork(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/70 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                                    >
                                        {NETWORKS.map((network) => (
                                            <option key={network.value} value={network.value}>
                                                {network.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-2">
                                        Amount
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full px-3 py-2.5 pr-16 bg-gray-800/50 border border-gray-700/70 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">
                                            {selectedToken.symbol}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Available: <span className="text-gray-400 font-medium">{selectedToken.balance} {selectedToken.symbol}</span>
                                    </div>
                                </div>
                            </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    Please select a token first
                                </div>
                            )}
                        </Step>

                        {/* Step 3: Review */}
                        <Step>
                            {selectedToken && amount ? (
                                <div className="space-y-5">
                                    <h3 className="text-base font-semibold text-white/90 mb-4">Review your deposit</h3>

                                <div className="p-6 bg-gradient-to-br from-teal-500/10 via-blue-500/5 to-purple-500/10 border border-teal-500/30 rounded-xl space-y-4 shadow-xl shadow-teal-500/5">
                                    <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                                        <span className="text-gray-400 text-sm">Token</span>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                                                selectedToken.symbol === 'BTC' ? 'bg-gradient-to-br from-orange-500/30 to-orange-600/30 text-orange-400' :
                                                selectedToken.symbol === 'ETH' ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 text-blue-400' :
                                                selectedToken.symbol === 'USDC' ? 'bg-gradient-to-br from-blue-600/30 to-blue-700/30 text-blue-300' :
                                                'bg-gradient-to-br from-green-500/30 to-green-600/30 text-green-400'
                                            }`}>
                                                {selectedToken.icon}
                                            </div>
                                            <span className="text-white font-semibold">{selectedToken.symbol}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-b border-gray-700/50">
                                        <span className="text-gray-400 text-sm">Network</span>
                                        <span className="text-white font-medium text-sm">
                                            {NETWORKS.find(n => n.value === selectedNetwork)?.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-3">
                                        <span className="text-gray-400 text-sm">Amount</span>
                                        <span className="text-teal-400 font-bold text-xl">
                                            {amount} {selectedToken.symbol}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                                    <p className="text-yellow-300/90 text-sm leading-relaxed">
                                        ⚠ Please review your deposit details carefully. This transaction cannot be reversed once confirmed.
                                    </p>
                                </div>
                            </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    Please complete previous steps
                                </div>
                            )}
                        </Step>
                    </Stepper>
                </div>
            </div>
        </div>
    );
};

export default DepositModal;
