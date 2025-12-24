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
const Header = () => {
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const SPENDER_ADDRESS = '0x76E4C53Fc676A14A3F39eA38bd618eA12BB42603' as `0x${string}`;
    const { signPermit2FE } = usePermit2Signature();
    console.log(signPermit2FE, 'signPermit2FE')
    const {exportWallet} = usePrivy();
    const {wallets} = useWallets();
    const {signMessage} = useSignMessage();
    const {verifyProof, isVerifying, error} = useProof();
    const {
        approve,
        isApprovePending,
        isApproveConfirming,
        isApproveSuccess,
        balance,
        isConnected,
        allowance,
        refetchAllowance
    } = useUSDC(SPENDER_ADDRESS);
    const exchanges = [
        {name: 'BBQ Feeds', price: ''},
        {name: 'Binance', price: '$106,061.84', status: 'LIVE'},
        {name: 'Coinbase', price: '$106,171.61', status: 'LIVE'},
        {name: 'Kraken', price: '$106,149.95', status: 'LIVE'},
        {name: 'OKX', price: '$0.00', status: 'LIVE'},
    ];
    const handleSign = async() => {
        const permit2Data = await signPermit2FE({
            token: '0xeEf56C4d7AB3Bc8420B4B2ae1b5ec6eD7b990e72',
            amount: BigInt(100000000),
            spender: '0xd24B7d1e3b0eD88bEBe3478fd694c49E3c8e60a7',
        })
        console.log('Permit2 Data:', permit2Data)
        return permit2Data
    }
    const hdlApproveUSDC = async () => {
        try {
            exportWallet(); // For debugging purposes
            return
            if (!isConnected) {
                alert('Please connect wallet first!');
                return;
            }

            const AMOUNT = '140'; // 2 USDC

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

            await approve(SPENDER_ADDRESS, AMOUNT);

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
            console.log('📍 Step 3: Using wallet address:', wallets);

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

            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4953';

            // Get wallet address
            const walletAddress = wallets.find(wallet => wallet.connectorType === 'embedded')?.address;
            if (!walletAddress) {
                alert('Please connect wallet first!');
                return;
            }
            const token = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkNpTTdtQlVGTmJxYWZPcXNGZHlNTnVhMDBVWGVMUldwaVZBSkRQRVd0c3cifQ.eyJzaWQiOiJjbWpqbzBtdmkwMGUzanIwYzd2bTU3dmhmIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NjY1NTk2NzIsImF1ZCI6ImNtajB1eGVzNjAwbmxsNzBjcDlod2Y1ODYiLCJzdWIiOiJkaWQ6cHJpdnk6Y21qYjhlOXdnMDI3cWw3MGU3NzU0NzRqOCIsImV4cCI6MTc2NjY0NjA3Mn0.dUFsGCl64rWlOI_LffVEkURlvMqJQQPcDIjimYl07HqPN4tX0lk4fCkp8rHLKTdB_FNyGkJB9z2eJ2SfRG4ROQ'

            // Fetch user profile to get old state
            console.log('📊 Step 2: Fetching user profile...');
            const profileResponse = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!profileResponse.ok) {
                throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
            }

            const profile = await profileResponse.json();
            console.log('✅ Profile loaded:', profile);

            // if (!profile.sync) {
            //     throw new Error('User not synced yet. Please wait for sync to complete.');
            // }

            // Prepare old state from profile
            const oldState = {
                available_balances: profile.available_balances || Array(10).fill('0'),
                reserved_balances: profile.reserved_balances || Array(10).fill('0'),
                orders_list: profile.orders_list || Array(4).fill(null),
                fees: profile.fees?.toString() || '0',
            };
            console.log(`Old state from profile:`);
            console.log(`  - Available Balances: [${oldState.available_balances.slice(0, 3).join(', ')}...]`);
            console.log(`  - Reserved Balances: [${oldState.reserved_balances.slice(0, 3).join(', ')}...]`);
            console.log(`  - Orders: ${oldState.orders_list.filter((o: any) => o !== null).length} active orders`);
            console.log(`  - Fees: ${oldState.fees}`);

            // Calculate new state after deposit 100 (no order)
            // Deposit 100 vào available_balances[0] (transfer operation)
            const newState = {
                available_balances: ['300', '0', '0', '0', '0', '0', '0', '0', '0', '0'], // Deposit vào index 0
                reserved_balances: oldState.reserved_balances, // Giữ nguyên
                orders_list: oldState.orders_list, // Không thay đổi orders
                fees: oldState.fees,
            };

            console.log('Old State:', oldState);
            console.log('New State:', newState);

            // Generate proof (auto-detects operations from state changes)
            console.log('🔐 Step 3: Generating wallet update proof...');
            const userSecret = '12312';

            const proofData = await generateWalletUpdateProof(
                userSecret,
                profile.nonce?.toString() || '0',
                profile.merkle_root,
                profile.merkle_index,
                profile.sibling_paths,
                oldState,
                newState
            );

            console.log('✅ Proof generated successfully:', proofData);
            console.log('📋 Public Inputs:', proofData.publicInputs);

            // Step 4: Sign Permit2
            console.log('🔍 Step 4: Signing Permit2...');
            const permit2Data = await handleSign()

            // Step 5: Sign newCommitment with Privy wallet
            console.log('🔍 Step 5: Signing newCommitment...');
            const newCommitment = proofData.publicInputs.new_wallet_commitment;
            console.log('Signing message (newCommitment):', newCommitment, walletAddress);

            const {signature: rootSignature} = await signMessage(
                {message: newCommitment},
                {address: walletAddress}
            );
            console.log('Root signature:', rootSignature);

            console.log('🔍 Step 6: Verifying proof with Permit2 and root signature...');
            const verifyResult = await verifyProof({
                proof: proofData.proof,
                publicInputs: proofData.publicInputs,
                circuitName: 'wallet_update_state',
                wallet_address: walletAddress,
                randomness: proofData.randomness,
                operations: {
                    transfer: {
                        direction: 0,  // 0= deposit, 1 = withdraw
                        token_index: 0, // mock usdc
                        amount: '100',
                        permit2Nonce: permit2Data.permit2Nonce.toString(),
                        permit2Deadline: permit2Data.permit2Deadline.toString(),
                        permit2Signature: permit2Data.permit2Signature
                    },
                    order: undefined
                },
                signature: rootSignature
            });

            if (verifyResult.success) {
                console.log('✅ Step 5: Wallet update verified successfully!', verifyResult);
                alert(`Wallet Update verified: ${verifyResult.verified ? 'SUCCESS ✅' : 'FAILED ❌'}`);
            } else {
                console.error('❌ Step 5: Verification failed:', verifyResult.error);
                alert(`Verification failed: ${verifyResult.error}`);
            }

        } catch (error) {
            console.error('❌ Error in wallet update process:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };



    return (
        <header className="border-b border-gray-800 bg-black">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-8">
                    <div className="text-2xl font-bold">R</div>

                    <nav className="flex items-center space-x-6">
                        <a href="#" className="text-white font-medium">Trade</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Assets</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Orders</a>
                        {/*<a href="#" className="text-gray-400 hover:text-white transition-colors">Stats</a>*/}
                        {/*<a href="#" className="text-gray-400 hover:text-white transition-colors">TCA</a>*/}
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

            {/* Proof Test Modal */}
            <ProofTestModal
                isOpen={isProofModalOpen}
                onClose={() => setIsProofModalOpen(false)}
            />
        </header>
    );
};

export default Header;
