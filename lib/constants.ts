// Token configuration
export const TOTAL_TOKEN = 10; // Số lượng token hỗ trợ trong wallet

// Order configuration
export const MAX_PENDING_ORDER = 4; // Số lượng order tối đa có thể pending

// ============================================
// API CONFIGURATION
// ============================================

// API prefix
export const API_PREFIX = '/api/v1';

// API Endpoints - Centralized
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    GENERATE_NONCE: `${API_PREFIX}/auth/generate-nonce`,
    LOGIN: `${API_PREFIX}/auth/login`,
    REFRESH: `${API_PREFIX}/auth/refresh`,
    LOGOUT: `${API_PREFIX}/auth/logout`,
  },

  // User
  USER: {
    PROFILE: `${API_PREFIX}/user/profile`,
    UPDATE_PROFILE: `${API_PREFIX}/user/profile`,
  },

  // Proof
  PROOF: {
    VERIFY: `${API_PREFIX}/proofs/verify`,
    INIT_WALLET: `${API_PREFIX}/proofs/init-wallet`,
    UPDATE_WALLET: `${API_PREFIX}/proofs/update-wallet`,
    GENERATE_WALLET_INIT: '/api/proof/generate-wallet-init',
    GENERATE_WALLET_UPDATE: '/api/proof/generate-wallet-update',
  },

  // Token
  TOKEN: {
    GET_ALL: `${API_PREFIX}/token/all`,
    GET_BY_ID: `${API_PREFIX}/token/:id`,
    GET_BALANCE: `${API_PREFIX}/token/balance`,
  },

  // Utils
  UTILS: {
    POSEIDON_HASH: '/api/utils/poseidon-hash',
  },
} as const;
