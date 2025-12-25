import { useState, useEffect } from 'react';
import { getAllTokens, type Token } from '@/lib/services';

/**
 * Hook to fetch and manage tokens
 *
 * Features:
 * - Auto fetch tokens on mount
 * - Loading state
 * - Error handling
 * - Refetch function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { tokens, isLoading, error, refetch } = useTokens();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <div>
 *       {tokens.map(token => (
 *         <div key={token.index}>{token.symbol}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTokens(autoFetch = true) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🪙 Fetching tokens from API...');
      const data = await getAllTokens();
      console.log('✅ Tokens fetched:', data);
      setTokens(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch tokens';
      console.error('❌ Error fetching tokens:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchTokens();
    }
  }, [autoFetch]);

  return {
    tokens,
    isLoading,
    error,
    refetch: fetchTokens,
  };
}
