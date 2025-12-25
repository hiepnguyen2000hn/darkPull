/**
 * Token API - Functions to interact with token endpoints
 */

import apiClient from './api';
import { TOKEN_ENDPOINTS } from './api-endpoints';

// ============================================
// TYPES
// ============================================

export interface Token {
  name: string;
  symbol: string;
  address: string;
  index: number;
  decimals: number;
}

export interface GetAllTokensResponse {
  tokens: Token[];
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all active tokens
 *
 * @returns List of all active tokens
 *
 * @example
 * const tokens = await getAllTokens();
 * console.log(tokens); // [{ name: 'Bitcoin', symbol: 'BTC', ... }]
 */
export async function getAllTokens(): Promise<Token[]> {
  try {
    const response = await apiClient.get<Token[]>(TOKEN_ENDPOINTS.GET_ALL);
    return response.data;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    throw error;
  }
}

/**
 * Get token by ID
 *
 * @param id - Token ID
 * @returns Token details
 */
export async function getTokenById(id: string): Promise<Token> {
  try {
    const endpoint = TOKEN_ENDPOINTS.GET_BY_ID.replace(':id', id);
    const response = await apiClient.get<Token>(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching token ${id}:`, error);
    throw error;
  }
}

/**
 * Get token balance for a wallet
 *
 * @param walletAddress - Wallet address
 * @param tokenAddress - Token contract address (optional)
 * @returns Token balances
 */
export async function getTokenBalance(
  walletAddress: string,
  tokenAddress?: string
): Promise<any> {
  try {
    const response = await apiClient.get(TOKEN_ENDPOINTS.GET_BALANCE, {
      params: {
        walletAddress,
        ...(tokenAddress && { tokenAddress }),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw error;
  }
}
