'use client';

import { useTokens } from '@/hooks/useTokens';
import { useEffect } from 'react';

/**
 * TokensProvider - Auto-fetch tokens on app load
 *
 * This component fetches all tokens from API and stores them in Jotai store
 * Place this component high in the component tree (e.g., in layout)
 */
export function TokensProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isLoading, error } = useTokens(true); // Auto-fetch enabled

  useEffect(() => {
    if (isLoaded) {
      console.log('🪙 Tokens loaded successfully');
    }
    if (error) {
      console.error('❌ Failed to load tokens:', error);
    }
  }, [isLoaded, error]);

  // Don't block rendering - tokens will load in background
  return <>{children}</>;
}
