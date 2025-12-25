/**
 * API Endpoints - Centralized API endpoint definitions
 *
 * Base URL từ .env.local: NEXT_PUBLIC_API_URL
 */

// ============================================
// AUTH ENDPOINTS
// ============================================
export const AUTH_ENDPOINTS = {
  GENERATE_NONCE: '/api/v1/auth/generate-nonce',
  LOGIN: '/api/v1/auth/login',
  REFRESH: '/api/v1/auth/refresh',
  LOGOUT: '/api/v1/auth/logout',
} as const;

// ============================================
// USER ENDPOINTS
// ============================================
export const USER_ENDPOINTS = {
  PROFILE: '/api/v1/user/profile',
  UPDATE_PROFILE: '/api/v1/user/profile',
} as const;

// ============================================
// PROOF ENDPOINTS
// ============================================
export const PROOF_ENDPOINTS = {
  VERIFY: '/api/v1/proofs/verify',
  GENERATE_WALLET_INIT: '/api/proof/generate-wallet-init',
  GENERATE_WALLET_UPDATE: '/api/proof/generate-wallet-update',
} as const;

// ============================================
// TOKEN ENDPOINTS
// ============================================
export const TOKEN_ENDPOINTS = {
  GET_ALL: '/api/v1/token/all',
  GET_BY_ID: '/api/v1/token/:id',
  GET_BALANCE: '/api/v1/token/balance',
} as const;

// ============================================
// UTILS ENDPOINTS
// ============================================
export const UTILS_ENDPOINTS = {
  POSEIDON_HASH: '/api/utils/poseidon-hash',
} as const;

// ============================================
// ALL ENDPOINTS (for easy import)
// ============================================
export const API_ENDPOINTS = {
  ...AUTH_ENDPOINTS,
  ...USER_ENDPOINTS,
  ...PROOF_ENDPOINTS,
  ...TOKEN_ENDPOINTS,
  ...UTILS_ENDPOINTS,
} as const;

/**
 * Helper function để build endpoint với params
 *
 * @example
 * buildEndpoint(TOKEN_ENDPOINTS.GET_BY_ID, { id: '123' })
 * // Returns: '/api/v1/token/123'
 */
export function buildEndpoint(
  endpoint: string,
  params?: Record<string, string | number>
): string {
  if (!params) return endpoint;

  let result = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });

  return result;
}
