"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import Stepper, { Step } from './Stepper';
import { useUSDC } from '@/hooks/useUSDC';
import { DARKPOOL_CORE_ADDRESS, MOCK_USDC_ADDRESS, PERMIT2_ADDRESS } from '@/lib/constants';
import { TokenIconBySymbol } from './TokenSelector';
import { useTokens } from '@/hooks/useTokens';
import { type Token, getUserProfile } from '@/lib/services';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { useProof, useWalletUpdateProof } from '@/hooks/useProof';
import { usePermit2Signature } from '@/hooks/usePermit2Signature';
import { type TransferAction, type WalletState } from '@/hooks/useProof';
import { extractPrivyWalletId } from '@/lib/wallet-utils';
import { signMessageWithSkRoot } from '@/lib/ethers-signer';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';

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
    const [isProcessing, setIsProcessing] = useState(false); // ✅ Loading state
    const [processingStep, setProcessingStep] = useState(''); // ✅ Current processing step

    // Fetch tokens from API with cache
    const { tokens, isLoading: isLoadingTokens } = useTokens();

    // Privy hooks
    const { user } = usePrivy();
    const { wallets } = useWallets();

    // Proof hooks
    const { verifyProof, calculateNewState } = useProof();
    const { generateWalletUpdateProofClient } = useWalletUpdateProof();
    const { signPermit2FE } = usePermit2Signature();

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
    } = useUSDC(PERMIT2_ADDRESS);

    // ✅ Don't render if modal is closed
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
            // ✅ Set processing state (will show loading overlay)
            setIsProcessing(true);
            setProcessingStep('Initializing...');

            console.log('💰 Starting deposit process...', { selectedToken, selectedNetwork, amount });

            if (!isConnected) {
                toast.error('Please connect wallet first!');
                setIsProcessing(false);
                return;
            }

            if (!selectedToken || !amount) {
                toast.error('Missing required fields');
                setIsProcessing(false);
                return;
            }

            // Get wallet address
            const walletAddress = wallets.find(wallet => wallet.connectorType === 'embedded')?.address;
            if (!walletAddress) {
                toast.error('Please connect wallet first!');
                setIsProcessing(false);
                return;
            }

            // Get Privy user ID
            if (!user?.id) {
                toast.error('Please authenticate with Privy first!');
                setIsProcessing(false);
                return;
            }

            // Only process USDC for now
            if (selectedToken.symbol === 'USDC') {
                console.log('💰 Current USDC Balance:', usdcBalance);
                console.log('📊 Current allowance:', allowance);

                const requiredAmount = parseFloat(amount);
                const currentAllowance = parseFloat(allowance);

                // Step 1: Check and approve if needed
                if (currentAllowance < requiredAmount) {
                    console.log(`⚠️ Allowance insufficient! Current: ${currentAllowance} USDC, Required: ${requiredAmount} USDC`);
                    console.log('🔐 Step 1: Approving USDC to spender:', PERMIT2_ADDRESS);

                    setProcessingStep('Approving USDC...');
                    await approve(PERMIT2_ADDRESS, amount);

                    console.log('✅ Approval transaction confirmed!');
                } else {
                    console.log(`✅ Allowance already sufficient! Current: ${currentAllowance} USDC, Required: ${requiredAmount} USDC`);
                }

                // Step 2: Get user profile and old state
                setProcessingStep('Fetching user profile...');
                console.log('📊 Step 2: Fetching user profile...');
                const walletId = extractPrivyWalletId(user.id);
                console.log('  - Wallet ID (without prefix):', walletId);

                const profile = await getUserProfile(walletId);
                console.log('✅ Profile loaded:', profile);

                const oldState: WalletState = {
                    available_balances: profile.available_balances || Array(10).fill('0'),
                    reserved_balances: profile.reserved_balances || Array(10).fill('0'),
                    orders_list: profile.orders_list || Array(4).fill(null),
                    fees: profile.fees?.toString() || '0',
                    blinder: profile.blinder,
                };

                // Step 3: Sign Permit2
                setProcessingStep('Signing Permit2...');
                console.log('🔍 Step 3: Signing Permit2...');
                const permit2Data = await signPermit2FE({
                    token: MOCK_USDC_ADDRESS,
                    amount: parseUnits(amount, 6), // ✅ Convert to USDC decimals (6) using viem
                    spender: DARKPOOL_CORE_ADDRESS,
                });
                console.log('✅ Permit2 signed:', {
                    nonce: permit2Data.permit2Nonce.toString(),
                    deadline: permit2Data.permit2Deadline.toString(),
                    signature: permit2Data.permit2Signature.substring(0, 20) + '...'
                });

                // Step 4: Create TransferAction
                const action: TransferAction = {
                    type: 'transfer',
                    direction: 0,
                    token_index: 0,
                    amount: amount,
                    permit2Nonce: permit2Data.permit2Nonce.toString(),
                    permit2Deadline: permit2Data.permit2Deadline.toString(),
                    permit2Signature: permit2Data.permit2Signature
                };

                // Step 5: Calculate new state
                setProcessingStep('Calculating new state...');
                console.log('🔐 Step 5: Calculating new state...');
                const { newState, operations } = await calculateNewState(
                    oldState,
                    action,
                    profile.nonce || 0
                );

                console.log('✅ New state calculated:');
                console.log(`  - Available Balances: [${newState.available_balances.slice(0, 3).join(', ')}...]`);
                console.log(`  - New Blinder: ${newState.blinder?.substring(0, 20)}...`);
                console.log('  - Operations:', operations);

                // Step 6: Generate proof
                setProcessingStep('Generating proof (this may take a moment)...');
                console.log('🔐 Step 6: Generating wallet update proof...');
                const userSecret = '12312';

                const proofData = await generateWalletUpdateProofClient({
                    userSecret,
                    oldNonce: profile.nonce?.toString() || '0',
                    oldMerkleRoot: profile.merkle_root,
                    oldMerkleIndex: profile.merkle_index,
                    oldHashPath: profile.sibling_paths,
                    oldState,
                    newState,
                    operations
                });

                console.log('✅ Proof generated successfully:', proofData);

                // Step 7: Sign newCommitment
                setProcessingStep('Signing commitment...');
                console.log('🔍 Step 7: Signing newCommitment...');
                const newCommitment = proofData.publicInputs.new_wallet_commitment;
                const rootSignature = await signMessageWithSkRoot(newCommitment);
                console.log('✅ Signature created!');

                // Step 8: Verify proof
                setProcessingStep('Verifying proof...');
                console.log('🔍 Step 8: Verifying proof...');
                const verifyResult = await verifyProof({
                    proof: proofData.proof,
                    publicInputs: proofData.publicInputs,
                    wallet_address: walletAddress,
                    operations,
                    signature: rootSignature
                });

                if (verifyResult.success) {
                    console.log('✅ Deposit completed successfully!', verifyResult);
                    setProcessingStep('Deposit completed!');
                    if (verifyResult.verified) {
                        toast.success(`Deposit verified successfully!\nAmount: ${amount} USDC`, {
                            duration: 5000,
                        });
                    } else {
                        toast.error('Deposit verification failed');
                    }
                } else {
                    console.error('❌ Verification failed:', verifyResult.error);
                    toast.error(`Verification failed: ${verifyResult.error}`);
                    // ✅ Verification failed → ẩn loading, giữ modal
                    setIsProcessing(false);
                    setProcessingStep('');
                    return;
                }
            } else {
                console.log('ℹ️ Token not USDC, skipping for now');
                toast.error(`Deposit not available for ${selectedToken.symbol} yet`);
                // ✅ Token not supported → ẩn loading, giữ modal
                setIsProcessing(false);
                setProcessingStep('');
                return;
            }

            // ✅ Success → Reset all state and close modal completely
            setIsProcessing(false);
            setProcessingStep('');
            handleClose(); // ✅ Close modal and reset state
        } catch (error) {
            console.error('❌ Error in deposit process:', error);
            toast.error(error instanceof Error ? error.message : 'Unknown error occurred');
            // ✅ Error → Ẩn loading overlay, giữ modal để user thử lại
            setIsProcessing(false);
            setProcessingStep('');
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

    return (
        <>
            {/* ✅ Fullscreen Loading Overlay - shows when processing */}
            {isProcessing && (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="w-20 h-20 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                    <div className="text-white font-medium text-xl mt-6">{processingStep}</div>
                    <div className="text-gray-400 text-sm mt-2">Please wait, do not close this window...</div>
                </div>
            )}

            {/* ✅ Modal Content - hidden when processing */}
            {!isProcessing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-xl mx-4 bg-gradient-to-b from-gray-900 to-gray-900/95 border border-gray-700/70 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
                        <h2 className="text-xl font-bold text-white">Deposit Assets</h2>
                        <button
                            onClick={handleClose}
                            disabled={isProcessing}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                {isLoadingTokens ? (
                                    <div className="text-center py-10 text-gray-400">Loading tokens...</div>
                                ) : (
                                    <div className="max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-teal-500/50 scrollbar-track-gray-800/50 hover:scrollbar-thumb-teal-500/70 scroll-smooth">
                                        <div className="grid gap-2.5">
                                            {tokens.map((token) => (
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
                                                        <div className="w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                                                            <TokenIconBySymbol symbol={token.symbol} size="md" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-white font-semibold text-sm">{token.symbol}</div>
                                                            <div className="text-gray-400 text-xs">{token.name}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-gray-500 text-xs mb-0.5">Balance</div>
                                                        <div className="text-white/90 font-medium text-xs">
                                                            {token.symbol === 'USDC' ? usdcBalance : '0.00'}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Step>

                        {/* Step 2: Network & Amount */}
                        <Step>
                            {selectedToken ? (
                                <div className="space-y-4">
                                    <h3 className="text-base font-semibold text-white/90">Enter deposit details</h3>

                                {/* Selected Token Display */}
                                <div className="p-3 bg-gradient-to-r from-teal-500/5 to-blue-500/5 border border-teal-500/30 rounded-lg flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                        <TokenIconBySymbol symbol={selectedToken.symbol} size="md" />
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
                                        Available: <span className="text-gray-400 font-medium">
                                            {selectedToken.symbol === 'USDC' ? usdcBalance : '0.00'} {selectedToken.symbol}
                                        </span>
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
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                                <TokenIconBySymbol symbol={selectedToken.symbol} size="sm" />
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
            )}
        </>
    );
};

export default DepositModal;
