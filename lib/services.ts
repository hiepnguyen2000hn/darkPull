/**
 * API Services - Centralized API call functions
 *
 * Tất cả các API calls được export từ file này
 */

import apiClient from './api';
import { API_ENDPOINTS } from './constants';

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

export interface UserProfile {
  _id: string;
  wallet_address: string;
  available_balances: string[];
  reserved_balances: string[];
  orders_list: any[];
  fees: string;
  nonce: number;
  merkle_root: string;
  merkle_index: number;
  sibling_paths: string[];
  sync: boolean;
  created_at: string;
  updated_at: string;
}

export interface VerifyProofRequest {
  proof: string;
  publicInputs: Record<string, string>;
  circuitName: string;
  wallet_address: string;
  randomness: string;
  operations?: {
    transfer?: {
      direction: number;
      token_index: number;
      amount: string;
      permit2Nonce?: string;
      permit2Deadline?: string;
      permit2Signature?: string;
    };
    order?: {
      operation_type: number;
      order_index: number;
      order_data?: {
        id: string;
        price: string;
        qty: string;
        side: string;
        token_in: string;
        token_out: string;
      };
    };
  };
  signature?: string;
}

export interface InitWalletProofRequest {
  proof: string;
  wallet_address: string;
  randomness: string;
  signature: string;
  publicInputs: {
    initial_commitment: string;
  };
}

export interface UpdateWalletProofRequest {
  proof: string;
  wallet_address: string;
  randomness: string;
  signature: string;
  publicInputs: {
    old_wallet_commitment: string;
    new_wallet_commitment: string;
    nullifier: string;
    old_merkle_root: string;
    transfer_mint: string;
    transfer_amount: string;
    transfer_direction: string;
  };
  operations: {
    transfer: {
      direction: number;
      token_index: number;
      amount: string;
      permit2Nonce: string;
      permit2Deadline: string;
      permit2Signature: string;
    };
    order: {
      operation_type: number;
      order_index: number;
      order_data: {
        price: string;
        qty: string;
        side: number;
        token_in: number;
        token_out: number;
      };
    };
  };
}

// ============================================
// AUTH SERVICES
// ============================================

export async function generateNonce(address: string): Promise<{ nonce: string }> {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.GENERATE_NONCE, {
    address,
  });
  return response.data;
}

export async function login(address: string, signature: string): Promise<{ access_token: string }> {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    address,
    signature,
  });
  return response.data;
}

// ============================================
// USER SERVICES
// ============================================

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE, {
    params: { userId },
  });
  return response.data;
}

// ============================================
// TOKEN SERVICES
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
  const response = await apiClient.get<Token[]>(API_ENDPOINTS.TOKEN.GET_ALL);
  return response.data;
}

/**
 * Get token by ID
 *
 * @param id - Token ID
 * @returns Token details
 */
export async function getTokenById(id: string): Promise<Token> {
  const endpoint = API_ENDPOINTS.TOKEN.GET_BY_ID.replace(':id', id);
  const response = await apiClient.get<Token>(endpoint);
  return response.data;
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
  const response = await apiClient.get(API_ENDPOINTS.TOKEN.GET_BALANCE, {
    params: {
      walletAddress,
      ...(tokenAddress && { tokenAddress }),
    },
  });
  return response.data;
}

// ============================================
// PROOF SERVICES
// ============================================

/**
 * Verify proof and submit to backend
 *
 * @param data - Proof verification request
 * @returns Verification result
 */
export async function verifyProof(data: VerifyProofRequest): Promise<any> {
  const response = await apiClient.post(API_ENDPOINTS.PROOF.VERIFY, data);
  return response.data;
}

/**
 * Initialize wallet proof - Verify wallet initialization proof
 *
 * @param data - Init wallet proof request
 * @returns Verification result
 *
 * @example
 * const result = await initWalletProof({
 *   proof: "0x1234567890abcdef...",
 *   wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *   randomness: "12345678901234567890",
 *   signature: "0x1234567890abcdef...",
 *   publicInputs: {
 *     initial_commitment: "0x123..."
 *   }
 * });
 */
export async function initWalletProof(data: InitWalletProofRequest): Promise<any> {
  const response = await apiClient.post(API_ENDPOINTS.PROOF.INIT_WALLET, data);
  return response.data;
}

/**
 * Update wallet proof - Verify wallet update proof
 *
 * @param data - Update wallet proof request
 * @returns Verification result
 *
 * @example
 * const result = await updateWalletProof({
 *   proof: "0x1234567890abcdef...",
 *   wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *   randomness: "12345678901234567890",
 *   signature: "0x1234567890abcdef...",
 *   publicInputs: {
 *     old_wallet_commitment: "0x123...",
 *     new_wallet_commitment: "0x456...",
 *     nullifier: "0x789...",
 *     old_merkle_root: "0xabc...",
 *     transfer_mint: "0",
 *     transfer_amount: "1000000",
 *     transfer_direction: "0"
 *   },
 *   operations: {
 *     transfer: {
 *       direction: 0,
 *       token_index: 0,
 *       amount: "1000000",
 *       permit2Nonce: "1000000",
 *       permit2Deadline: "1000000",
 *       permit2Signature: "1000000"
 *     },
 *     order: {
 *       operation_type: 0,
 *       order_index: 0,
 *       order_data: {
 *         price: "1000000000000000000",
 *         qty: "5000000000000000000",
 *         side: 0,
 *         token_in: 0,
 *         token_out: 1
 *       }
 *     }
 *   }
 * });
 */
export async function updateWalletProof(data: UpdateWalletProofRequest): Promise<any> {
  const response = await apiClient.post(API_ENDPOINTS.PROOF.UPDATE_WALLET, data);
  return response.data;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build endpoint with params
 *
 * @example
 * buildEndpoint(API_ENDPOINTS.TOKEN.GET_BY_ID, { id: '123' })
 * // Returns: '/api/v1/token/123'
 */
export function buildEndpoint(
  endpoint: string,
  params: Record<string, string | number>
): string {
  let result = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  return result;
}
