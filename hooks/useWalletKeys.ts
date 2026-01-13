'use client';

import { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { walletKeysAtom, pkRootAtom, skRootAtom, hasWalletKeysAtom, setWalletKeysExternal } from '@/store/walletKeys';
import { getAllKeys } from '@/lib/ethers-signer';

/**
 * Hook to access wallet keys with reactive updates
 *
 * - Initializes atom from localStorage on first mount
 * - Returns reactive values that update when saveAllKeys() is called
 * - Provides pk_root for Zenigma wallet address display
 */
export function useWalletKeys() {
  const [keys, setKeys] = useAtom(walletKeysAtom);

  // Initialize from localStorage on mount (only if atom is empty)
  useEffect(() => {
    if (!keys.pk_root) {
      const storedKeys = getAllKeys();
      if (storedKeys.pk_root) {
        setKeys(storedKeys);
      }
    }
  }, []);

  return {
    keys,
    pk_root: keys.pk_root,
    sk_root: keys.sk_root,
    pk_match: keys.pk_match,
    sk_match: keys.sk_match,
    hasKeys: !!(keys.pk_root && keys.sk_root),
    setKeys,
  };
}

/**
 * Hook to get only pk_root (Zenigma wallet address)
 * Lighter weight than useWalletKeys if you only need the address
 */
export function useZenigmaAddress() {
  const [keys, setKeys] = useAtom(walletKeysAtom);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (!keys.pk_root) {
      const storedKeys = getAllKeys();
      if (storedKeys.pk_root) {
        setKeys(storedKeys);
      }
    }
  }, []);

  return keys.pk_root;
}
