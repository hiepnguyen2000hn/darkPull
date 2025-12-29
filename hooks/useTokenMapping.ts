import { useAtomValue } from 'jotai';
import { tokensAtom, getTokenSymbolByIndex, getTokenByIndex } from '@/store/tokens';

/**
 * Custom hook để mapping token index -> symbol/object
 * Dùng chung ở nhiều component
 *
 * @example
 * const { getSymbol, getToken } = useTokenMapping();
 * const symbol = getSymbol(3); // "BTC"
 * const token = getToken(3);   // { symbol: "BTC", index: 3, ... }
 */
export function useTokenMapping() {
  const tokens = useAtomValue(tokensAtom);

  /**
   * Get token symbol by index
   * @param index Token index (0-9)
   * @returns Token symbol (e.g. "BTC", "USDC")
   */
  const getSymbol = (index: number): string => {
    return getTokenSymbolByIndex(tokens, index);
  };

  /**
   * Get full token object by index
   * @param index Token index (0-9)
   * @returns Full Token object or undefined
   */
  const getToken = (index: number) => {
    return getTokenByIndex(tokens, index);
  };

  /**
   * Get token index by symbol (reverse lookup)
   * @param symbol Token symbol (e.g. "BTC", "USDC")
   * @returns Token index or undefined
   */
  const getIndex = (symbol: string): number | undefined => {
    const token = tokens.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
    return token?.index;
  };

  /**
   * Format order pair (base/quote) based on side
   * @param tokenIn Token in index
   * @param tokenOut Token out index
   * @param side 0=buy, 1=sell
   * @returns Formatted pair string (e.g. "BTC/USDC")
   */
  const formatOrderPair = (tokenIn: number, tokenOut: number, side: number) => {
    const tokenInSymbol = getSymbol(tokenIn);
    const tokenOutSymbol = getSymbol(tokenOut);
    const isBuy = side === 0;

    // BUY: nhận token_in, trả token_out → Pair: token_in/token_out
    // SELL: trả token_out, nhận token_in → Pair: token_out/token_in
    const baseSymbol = isBuy ? tokenInSymbol : tokenOutSymbol;
    const quoteSymbol = isBuy ? tokenOutSymbol : tokenInSymbol;

    return `${baseSymbol}/${quoteSymbol}`;
  };

  return {
    tokens,
    getSymbol,
    getToken,
    getIndex,
    formatOrderPair,
  };
}
