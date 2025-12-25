"use client";

import { useBalances } from '@/hooks/useBalances';
import { useEffect } from 'react';

/**
 * BalanceProvider - Component để fetch và update balances vào store
 *
 * Wrap component này ở layout hoặc root component để tự động
 * fetch balances khi user connect wallet
 *
 * Usage:
 * ```tsx
 * // app/layout.tsx
 * export default function Layout({ children }) {
 *   return (
 *     <PrivyProvider>
 *       <WagmiProvider>
 *         <BalanceProvider>
 *           {children}
 *         </BalanceProvider>
 *       </WagmiProvider>
 *     </PrivyProvider>
 *   )
 * }
 * ```
 */
export default function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, refetch, isConnected } = useBalances();

  // TODO: Realtime update - CHƯA IMPLEMENT
  // Có thể uncomment một trong các strategies bên dưới

  // Strategy 1: Polling (Simple, works everywhere)
  // useEffect(() => {
  //   if (!isConnected) return;
  //
  //   const interval = setInterval(() => {
  //     console.log('🔄 Refetching balances...');
  //     refetch();
  //   }, 30000); // 30 seconds
  //
  //   return () => clearInterval(interval);
  // }, [isConnected, refetch]);

  // Log khi connect/disconnect
  useEffect(() => {
    if (isConnected) {
      console.log('✅ Wallet connected - Balances loaded');
    } else {
      console.log('❌ Wallet disconnected - Balances cleared');
    }
  }, [isConnected]);

  // Không render gì, chỉ chạy logic
  return <>{children}</>;
}
