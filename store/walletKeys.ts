import { atom } from 'jotai';
import { appStore } from '@/providers/JotaiProvider';

// ============================================
// WALLET KEYS STATE (Reactive + Persistent)
// ============================================

export interface WalletKeys {
  sk_root: string | null;
  pk_root: string | null;
  pk_match: string | null;
  sk_match: string | null;
}

const defaultKeys: WalletKeys = {
  sk_root: null,
  pk_root: null,
  pk_match: null,
  sk_match: null,
};

// Main atom for wallet keys (reactive)
export const walletKeysAtom = atom<WalletKeys>(defaultKeys);

/**
 * Set wallet keys from outside React (e.g., from saveAllKeys function)
 * Uses shared appStore so it syncs with Provider
 * This will trigger re-render in all components using walletKeysAtom
 */
export function setWalletKeysExternal(keys: Partial<WalletKeys>): void {
  const currentKeys = appStore.get(walletKeysAtom);
  appStore.set(walletKeysAtom, { ...currentKeys, ...keys });
}

/**
 * Clear wallet keys from outside React (e.g., logout)
 */
export function clearWalletKeysExternal(): void {
  appStore.set(walletKeysAtom, defaultKeys);
}

/**
 * Get wallet keys from outside React
 */
export function getWalletKeysExternal(): WalletKeys {
  return appStore.get(walletKeysAtom);
}

// ============================================
// DERIVED ATOMS (Read-only)
// ============================================

// Get pk_root (Zenigma wallet address)
export const pkRootAtom = atom((get) => get(walletKeysAtom).pk_root);

// Get sk_root
export const skRootAtom = atom((get) => get(walletKeysAtom).sk_root);

// Check if keys are loaded
export const hasWalletKeysAtom = atom((get) => {
  const keys = get(walletKeysAtom);
  return !!(keys.pk_root && keys.sk_root);
});

// ============================================
// ACTIONS (Write atoms)
// ============================================

// Set all keys at once
export const setWalletKeysAtom = atom(
  null,
  (get, set, keys: Partial<WalletKeys>) => {
    const currentKeys = get(walletKeysAtom);
    set(walletKeysAtom, { ...currentKeys, ...keys });
  }
);

// Clear all keys (logout)
export const clearWalletKeysAtom = atom(
  null,
  (get, set) => {
    set(walletKeysAtom, defaultKeys);
  }
);
