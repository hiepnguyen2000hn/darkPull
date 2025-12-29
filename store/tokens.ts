import { atom } from 'jotai';
import { Token } from '@/lib/services';

// ============================================
// TOKENS STATE
// ============================================

// All tokens list
export const tokensAtom = atom<Token[]>([]);

// Loading state
export const tokensLoadingAtom = atom<boolean>(false);

// Error state
export const tokensErrorAtom = atom<string | null>(null);

// ============================================
// DERIVED ATOMS
// ============================================

// Get token by index
export const tokenByIndexAtom = (index: number) =>
  atom((get) => {
    const tokens = get(tokensAtom);
    return tokens.find(token => token.index === index);
  });

// Get token by symbol
export const tokenBySymbolAtom = (symbol: string) =>
  atom((get) => {
    const tokens = get(tokensAtom);
    return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
  });

// Get token by address
export const tokenByAddressAtom = (address: string) =>
  atom((get) => {
    const tokens = get(tokensAtom);
    return tokens.find(token => token.address.toLowerCase() === address.toLowerCase());
  });

// Check if tokens are loaded
export const isTokensLoadedAtom = atom((get) => {
  return get(tokensAtom).length > 0;
});

// Get tokens count
export const tokensCountAtom = atom((get) => {
  return get(tokensAtom).length;
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get token symbol by index
 * Used for displaying orders: token_in/token_out (number) -> symbol (string)
 *
 * @example
 * getTokenSymbolByIndex(0) // "USDC"
 * getTokenSymbolByIndex(3) // "BTC"
 */
export const getTokenSymbolByIndex = (tokens: Token[], index: number): string => {
  const token = tokens.find(t => t.index === index);
  return token?.symbol || 'UNKNOWN';
};

/**
 * Get full token object by index
 */
export const getTokenByIndex = (tokens: Token[], index: number): Token | undefined => {
  return tokens.find(t => t.index === index);
};

// ============================================
// ACTIONS (WRITE ATOMS)
// ============================================

// Update entire tokens list
export const updateTokensAtom = atom(
  null,
  (get, set, tokens: Token[]) => {
    set(tokensAtom, tokens);
    set(tokensErrorAtom, null);
  }
);

// Update loading state
export const setTokensLoadingAtom = atom(
  null,
  (get, set, loading: boolean) => {
    set(tokensLoadingAtom, loading);
  }
);

// Update error state
export const setTokensErrorAtom = atom(
  null,
  (get, set, error: string | null) => {
    set(tokensErrorAtom, error);
  }
);

// Clear tokens (logout)
export const clearTokensAtom = atom(
  null,
  (get, set) => {
    set(tokensAtom, []);
    set(tokensLoadingAtom, false);
    set(tokensErrorAtom, null);
  }
);
