"use client";
import { useSignTypedData } from 'wagmi'
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import ConnectButton from './ConnectButton';
import ChainSelector from './ChainSelector';
import TokenDisplay from './TokenDisplay';
import ProofTestModal from './ProofTestModal';
import {usePrivy, useSignMessage} from '@privy-io/react-auth';
import {useWallets} from '@privy-io/react-auth';
import { useProof } from '@/hooks/useProof';
import { useUSDC } from '@/hooks/useUSDC';
import { generateWalletUpdateProof } from '@/lib/proof-helpers';
import { usePermit2Signature } from '@/hooks/usePermit2Signature'
import {getAllTokens, getUserProfile} from "@/lib/services";
import { useEffect } from 'react';
import { DARKPOOL_CORE_ADDRESS, MOCK_USDC_ADDRESS } from '@/lib/constants';
import { type OrderAction, type TransferAction, type WalletState } from '@/hooks/useProof';
import {useImportWallet} from '@privy-io/react-auth';

const Header = () => {
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const SPENDER_ADDRESS = DARKPOOL_CORE_ADDRESS;
    const { signPermit2FE } = usePermit2Signature();
    const {exportWallet} = usePrivy();
    const {wallets} = useWallets();
    const {signMessage} = useSignMessage();
    const {verifyProof, isVerifying, error, calculateNewState} = useProof();
    const {importWallet} = useImportWallet();
    const {
        approve,
        isApprovePending,
        isApproveConfirming,
        isApproveSuccess,
        balance,
        isConnected,
        allowance,
        refetchAllowance
    } = useUSDC('0x201E43b479Eb8f43bC3C2Ac83575943A9Ea6c85a');
    const exchanges = [
        {name: 'BBQ Feeds', price: ''},
        {name: 'Binance', price: '$106,061.84', status: 'LIVE'},
        {name: 'Coinbase', price: '$106,171.61', status: 'LIVE'},
        {name: 'Kraken', price: '$106,149.95', status: 'LIVE'},
        {name: 'OKX', price: '$0.00', status: 'LIVE'},
    ];
    const handleSign = async() => {
        const permit2Data = await signPermit2FE({
            token: MOCK_USDC_ADDRESS,
            amount: BigInt(100000000),
            spender: DARKPOOL_CORE_ADDRESS,
        })
        console.log('Permit2 Data:', permit2Data)
        return permit2Data
    }
    const hdlApproveUSDC = async () => {
        try {
            // exportWallet(); // For debugging purposes
            // return
            if (!isConnected) {
                alert('Please connect wallet first!');
                return;
            }
            console.log('pass')
            const AMOUNT = '200'; // 2 USDC

            console.log('💰 Current USDC Balance:', balance);

            // Step 1: Check current allowance
            console.log('🔍 Step 1: Checking current allowance...');
            console.log(`📊 Current allowance: ${allowance} USDC`);

            // Step 2: Compare allowance with amount
            const currentAllowance = parseFloat(allowance);
            const requiredAmount = parseFloat(AMOUNT);

            if (currentAllowance >= requiredAmount) {
                console.log(`✅ Allowance already sufficient! Current: ${currentAllowance} USDC, Required: ${requiredAmount} USDC`);
                alert(`Allowance already sufficient!\nCurrent: ${currentAllowance} USDC\nRequired: ${requiredAmount} USDC\n\nNo need to approve again.`);
                return;
            }

            // Step 3: Need to approve
            console.log(`⚠️ Allowance insufficient! Current: ${currentAllowance} USDC, Required: ${requiredAmount} USDC`);
            console.log('🔐 Step 2: Approving 2 USDC to spender:', SPENDER_ADDRESS);

            await approve('0xAC22c976371e123b8D5B20B7F3079C964cAfaa23', AMOUNT);

            console.log('✅ Approval transaction submitted!');
        } catch (error) {
            console.error('❌ Error approving USDC:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const hdlInitProof = async () => {
        try {
            console.log('🚀 Step 1: Generating proof...');

            // Generate proof
            const response = await fetch('/api/proof/generate-wallet-init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({userSecret: '12312'}),
            });

            if (!response.ok) {
                throw new Error(`Generate proof failed: ${response.status}`);
            }

            const proofData = await response.json();
            console.log('✅ Step 2: Proof generated successfully:', proofData);
            console.log(wallets, 'wallets');
            // Get wallet address
            const walletAddress = wallets.find(wallet => wallet.connectorType === 'embedded')?.address;
            console.log('📍 Step 3: Using wallet address:', proofData);

            const signatureData = await signMessage(
                {message: proofData.publicInputs.initial_commitment},
                {address: walletAddress as string}
            );
            console.log('Signature data:', signatureData);
            // Verify proof
            console.log('🔍 Step 4: Verifying proof...');
            const verifyResult = await verifyProof({
                proof: proofData.proof,
                publicInputs: {
                    initial_commitment: proofData.publicInputs.initial_commitment
                },
                circuitName: 'wallet_balance_update',
                wallet_address: walletAddress as string,
                randomness: proofData.randomness,
                signature: signatureData.signature
            });

            if (verifyResult.success) {
                console.log('✅ Step 5: Proof verified successfully!', verifyResult);
                alert(`Proof verified: ${verifyResult.verified ? 'SUCCESS ✅' : 'FAILED ❌'}`);
            } else {
                console.error('❌ Step 5: Verification failed:', verifyResult.error);
                alert(`Verification failed: ${verifyResult.error}`);
            }

        } catch (error) {
            console.error('❌ Error in proof process:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }





    const hdlUpdateWallet = async () => {
        try {
            console.log('🚀 Step 1: Updating wallet...');

            // Get wallet address
            const walletAddress = wallets.find(wallet => wallet.connectorType === 'embedded')?.address;
            if (!walletAddress) {
                alert('Please connect wallet first!');
                return;
            }

            // Fetch user profile to get old state (using API client with token from cookies)
            console.log('📊 Step 2: Fetching user profile...');
            const profile = await getUserProfile();
            console.log('✅ Profile loaded:', profile);

            const oldState: WalletState = {
                available_balances: profile.available_balances || Array(10).fill('0'),
                reserved_balances: profile.reserved_balances || Array(10).fill('0'),
                orders_list: profile.orders_list || Array(4).fill(null),
                fees: profile.fees?.toString() || '0',
            };

            // ✅ Step 2.5: Sign Permit2 TRƯỚC để lấy permit2 data
            console.log('🔍 Step 2.5: Signing Permit2...');
            const permit2Data = await handleSign();
            console.log('✅ Permit2 signed:', {
                nonce: permit2Data.permit2Nonce.toString(),
                deadline: permit2Data.permit2Deadline.toString(),
                signature: permit2Data.permit2Signature.substring(0, 20) + '...'
            });

            const action: TransferAction = {
                type: 'transfer',
                direction: 0,                    // ✅ 0 = DEPOSIT
                token_index: 0,                  // ✅ Token 0 (USDC)
                amount: '100',             // 100 USDC (6 decimals)
                // ✅ Permit2 data từ handleSign
                permit2Nonce: permit2Data.permit2Nonce.toString(),
                permit2Deadline: permit2Data.permit2Deadline.toString(),
                permit2Signature: permit2Data.permit2Signature
            };

            console.log('🔐 Step 3: Calculating new state...');
            const { newState, operations } = calculateNewState(oldState, action);

            console.log('✅ New state calculated:');
            console.log(`  - Available Balances: [${newState.available_balances.slice(0, 3).join(', ')}...]`);
            console.log(`  - Reserved Balances: [${newState.reserved_balances.slice(0, 3).join(', ')}...]`);
            console.log(`  - Orders: ${newState.orders_list.filter((o) => o !== null).length} active orders`);
            console.log('  - Operations:', operations);

            // Generate proof with operations
            console.log('🔐 Step 4: Generating wallet update proof with operations...');
            const userSecret = '12312';

            const proofData = await generateWalletUpdateProof(
                userSecret,
                profile.nonce?.toString() || '0',
                profile.merkle_root,
                profile.merkle_index,
                profile.sibling_paths,
                oldState,
                newState,
                operations  // ✅ Pass operations from calculateNewState
            );

            console.log('✅ Proof generated successfully:', proofData);
            console.log('📋 Public Inputs:', proofData.publicInputs);

            // Step 5: Sign newCommitment with Privy wallet
            console.log('🔍 Step 5: Signing newCommitment...');
            const newCommitment = proofData.publicInputs.new_wallet_commitment;
            console.log('Signing message (newCommitment):', newCommitment, walletAddress);

            const {signature: rootSignature} = await signMessage(
                {message: newCommitment},
                {address: walletAddress}
            );
            console.log('Root signature:', rootSignature);

            console.log('🔍 Step 6: Verifying proof with auto-generated operations...');
            const verifyResult = await verifyProof({
                proof: proofData.proof,
                publicInputs: proofData.publicInputs,
                circuitName: 'wallet_update_state',
                wallet_address: walletAddress,
                randomness: proofData.randomness,
                operations,
                signature: rootSignature
            });

            if (verifyResult.success) {
                console.log('✅ Step 7: Wallet update verified successfully!', verifyResult);
                alert(`Wallet Update verified: ${verifyResult.verified ? 'SUCCESS ✅' : 'FAILED ❌'}`);
            } else {
                console.error('❌ Step 7: Verification failed:', verifyResult.error);
                alert(`Verification failed: ${verifyResult.error}`);
            }

        } catch (error) {
            console.error('❌ Error in wallet update process:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const hdlInitWalletV2 = async () => {
        try {
            console.log('🚀 Step 1: Initializing wallet with V2 API...');

            // Get wallet address
            const walletAddress = wallets.find(wallet => wallet.connectorType === 'embedded')?.address;
            if (!walletAddress) {
                alert('Please connect wallet first!');
                return;
            }
            // exportWallet(); //
            // return
            // ============================================
            // STEP 2: Derive keys with V2 API
            // ============================================
            console.log('🔑 Step 2: Deriving keys with V2 API...');
            const chainId = 11155111; // Sepolia testnet

            const v2Response = await fetch(`/api/proof/generate-wallet-init-v2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    privateKey: 'b017b8a789c3ba15fa70093ab5915805a0f776be6a3e9043bc8ebccb7ecc231f',
                    chainId: chainId
                }),
            });

            if (!v2Response.ok) {
                const errorData = await v2Response.json().catch(() => ({}));
                throw new Error(errorData.message || `V2 API error: ${v2Response.status}`);
            }

            const keysData = await v2Response.json();
            console.log('✅ Step 2: Keys derived successfully!');
            console.log('  - sk_root:', keysData.keys.sk_root.substring(0, 20) + '...');
            console.log('  - pk_root:', keysData.keys.pk_root.substring(0, 20) + '...');
            console.log('  - pk_match:', keysData.keys.pk_match.substring(0, 20) + '...');
            console.log('  - sk_match:', keysData.keys.sk_match.substring(0, 20) + '...');
            console.log('  - blinder_seed:', keysData.keys.blinder_seed.substring(0, 20) + '...');

            // ============================================
            // STEP 3: Generate initial proof (hdlInitProof logic)
            // ============================================
            console.log('🔐 Step 3: Generating initial proof...');

            const proofResponse = await fetch('/api/proof/generate-wallet-init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userSecret: keysData.keys.sk_root  // ✅ Use sk_root as userSecret
                }),
            });

            if (!proofResponse.ok) {
                throw new Error(`Generate proof failed: ${proofResponse.status}`);
            }

            const proofData = await proofResponse.json();
            console.log('✅ Step 3: Proof generated successfully!');
            console.log('  - Proof:', proofData.proof.substring(0, 20) + '...');
            console.log('  - Initial Commitment:', proofData.publicInputs.initial_commitment.substring(0, 20) + '...');
            console.log('  - Randomness:', proofData.randomness.substring(0, 20) + '...');

            // ============================================
            // STEP 4: Sign initial commitment
            // ============================================
            console.log('📝 Step 4: Signing initial commitment...');

            const signatureData = await signMessage(
                {message: proofData.publicInputs.initial_commitment},
                {address: walletAddress as string}
            );

            console.log('✅ Step 4: Commitment signed!');
            console.log('  - Signature:', signatureData.signature.substring(0, 20) + '...');

            // ============================================
            // STEP 5: Prepare final payload
            // ============================================
            console.log('📦 Step 5: Preparing final payload...');

            const finalPayload = {
                proof: proofData.proof,
                wallet_address: walletAddress,
                blinder: keysData.keys.blinder_seed,
                signature: signatureData.signature,
                pk_root: keysData.keys.pk_root,
                pk_match: keysData.keys.pk_match,
                sk_match: keysData.keys.sk_match,
                publicInputs: {
                    initial_commitment: proofData.publicInputs.initial_commitment
                }
            };

            console.log('✅ Step 5: Final payload prepared:', {
                proof: finalPayload.proof.substring(0, 30) + '...',
                wallet_address: finalPayload.wallet_address,
                blinder: finalPayload.blinder.substring(0, 30) + '...',
                signature: finalPayload.signature.substring(0, 30) + '...',
                pk_root: finalPayload.pk_root.substring(0, 30) + '...',
                pk_match: finalPayload.pk_match.substring(0, 30) + '...',
                sk_match: finalPayload.sk_match.substring(0, 30) + '...',
                publicInputs: finalPayload.publicInputs
            });

            // ============================================
            // STEP 6: Send to final API
            // ============================================
            console.log('🚀 Step 6: Sending to final API...');

            const finalResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/proofs/init-wallet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalPayload),
            });

            if (!finalResponse.ok) {
                const errorData = await finalResponse.json().catch(() => ({}));
                console.error('❌ Final API error:', errorData);
                throw new Error(errorData.message || `Final API error: ${finalResponse.status}`);
            }

            const finalResult = await finalResponse.json();

            console.log('✅ Step 6: Wallet initialization completed!');
            console.log('Final result:', finalResult);

            alert(
                `Wallet V2 Initialized Successfully! ✅\n\n` +
                `Address: ${walletAddress}\n` +
                `Proof: ${proofData.proof.substring(0, 30)}...\n` +
                `Signature: ${signatureData.signature.substring(0, 30)}...\n\n` +
                `Check console for full payload!`
            );

        } catch (error) {
            console.error('❌ Error in V2 wallet initialization:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const fetchTokens = async () => {
        console.log('call token')
        const response = await getAllTokens()
        console.log('Tokens:', response);
    }

    useEffect(() => {
        fetchTokens()
    }, [])



    return (
        <header className="border-b border-gray-800 bg-black">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-8">
                    <div className="text-2xl font-bold">R</div>

                    <nav className="flex items-center space-x-6">
                        <a href="#" className="text-white font-medium">Trade</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Assets</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Orders</a>
                    </nav>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={hdlApproveUSDC}
                        disabled={isApprovePending || isApproveConfirming || !isConnected}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Approve 2 USDC"
                    >
                        <span>
                            {isApprovePending && 'Pending...'}
                            {isApproveConfirming && 'Confirming...'}
                            {isApproveSuccess && 'Approved ✅'}
                            {!isApprovePending && !isApproveConfirming && !isApproveSuccess && 'Approve USDC'}
                        </span>
                    </button>
                    <button
                        onClick={hdlInitProof}
                        disabled={isVerifying}
                        className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Test Wallet Proof API"
                    >
                        {/*<Flask size={16} />*/}
                        <span>{isVerifying ? 'Verifying...' : 'Test Proof API'}</span>
                    </button>
                    <button
                        onClick={hdlUpdateWallet}
                        disabled={isVerifying}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Wallet Update"
                    >
                        <span>{isVerifying ? 'Updating...' : 'Wallet Update'}</span>
                    </button>
                    <button
                        onClick={hdlInitWalletV2}
                        disabled={isVerifying || !isConnected}
                        className="flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Init Wallet V2 (EIP-712)"
                    >
                        <span>{isVerifying ? 'Initializing...' : 'Init Wallet V2'}</span>
                    </button>
                    <ChainSelector />
                    <ConnectButton />
                </div>
            </div>

            <div className="flex items-center space-x-8 px-6 py-2 overflow-x-auto">
                {exchanges.map((exchange, index) => (
                    <div key={index} className="flex items-center space-x-2 whitespace-nowrap">
                        <span className="text-gray-400 text-sm">{exchange.name}</span>
                        {exchange.price && (
                            <>
                                <span className="text-green-500 text-sm font-medium">{exchange.price}</span>
                                <span className="text-green-500 text-xs">{exchange.status}</span>
                            </>
                        )}
                        {index < exchanges.length - 1 && <span className="text-gray-700">•</span>}
                    </div>
                ))}
            </div>

            <ProofTestModal
                isOpen={isProofModalOpen}
                onClose={() => setIsProofModalOpen(false)}
            />
        </header>
    );
};

export default Header;
