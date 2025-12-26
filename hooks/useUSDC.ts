import { useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { MOCK_USDC_ADDRESS } from '@/lib/constants';

// USDC Contract Address
const USDC_ADDRESS = MOCK_USDC_ADDRESS;

// USDC Decimals (hardcoded for Sepolia fake USDC)
const USDC_DECIMALS = 6;

// ERC20 ABI - Only the functions we need
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'remaining', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;

export function useUSDC(spenderAddress?: `0x${string}`) {
  const { wallets } = useWallets();
  const [userAddress, setUserAddress] = useState<`0x${string}` | undefined>();

  // Get embedded wallet address
  useEffect(() => {
    const embeddedWallet = wallets.find(wallet => wallet.connectorType === 'embedded');
    if (embeddedWallet?.address) {
      setUserAddress(embeddedWallet.address as `0x${string}`);
    }
  }, [wallets]);

  // Check if wallet is connected
  const isConnected = !!userAddress;

  // Get USDC balance
  const {
    data: balanceData,
    refetch: refetchBalance,
    isLoading: isLoadingBalance
  } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    }
  });

  // Format balance
  const balance = balanceData
    ? formatUnits(balanceData as bigint, USDC_DECIMALS)
    : '0';

  // Get allowance for spender (if spenderAddress is provided)
  const {
    data: allowanceData,
    refetch: refetchAllowance,
    isLoading: isLoadingAllowance
  } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: !!(userAddress && spenderAddress),
    }
  });

  // Format allowance
  const allowance = allowanceData
    ? formatUnits(allowanceData as bigint, USDC_DECIMALS)
    : '0';

  // Approve USDC
  const {
    writeContract: approveWrite,
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  // Wait for approve transaction
  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess
  } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // Approve function
  const approve = async (spender: `0x${string}`, amount: string) => {
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const amountInWei = parseUnits(amount, USDC_DECIMALS);

      approveWrite({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amountInWei],
      });

      return approveTxHash;
    } catch (error) {
      console.error('Error approving USDC:', error);
      throw error;
    }
  };

  // Approve max amount (useful for DEX interactions)
  const approveMax = async (spender: `0x${string}`) => {
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

      approveWrite({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, maxAmount],
      });

      return approveTxHash;
    } catch (error) {
      console.error('Error approving max USDC:', error);
      throw error;
    }
  };

  return {
    // Connection status
    isConnected,
    userAddress,

    // Balance
    balance,
    balanceRaw: balanceData as bigint | undefined,
    isLoadingBalance,
    refetchBalance,

    // Decimals
    decimals: USDC_DECIMALS,

    // Allowance
    allowance,
    allowanceRaw: allowanceData as bigint | undefined,
    isLoadingAllowance,
    refetchAllowance,

    // Approve
    approve,
    approveMax,
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    approveError,
    approveTxHash,

    // Contract address
    usdcAddress: USDC_ADDRESS,
  };
}