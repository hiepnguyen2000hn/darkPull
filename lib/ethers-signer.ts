'use client';

import { ethers } from 'ethers';

const SECP256K1_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

// localStorage keys
const SK_ROOT_KEY = 'sk_root';
const PK_ROOT_KEY = 'pk_root';
const PK_MATCH_KEY = 'pk_match';
const SK_MATCH_KEY = 'sk_match';

/**
 * Save all wallet keys to localStorage
 */
export function saveAllKeys(keys: {
  sk_root: string;
  pk_root: string;
  pk_match: string;
  sk_match: string;
}): void {
  if (typeof window === 'undefined') {
    console.warn('localStorage not available (server-side)');
    return;
  }

  localStorage.setItem(SK_ROOT_KEY, keys.sk_root);
  localStorage.setItem(PK_ROOT_KEY, keys.pk_root);
  localStorage.setItem(PK_MATCH_KEY, keys.pk_match);
  localStorage.setItem(SK_MATCH_KEY, keys.sk_match);

  console.log('✅ All wallet keys saved to localStorage:');
  console.log('  - sk_root:', keys.sk_root.substring(0, 20) + '...');
  console.log('  - pk_root:', keys.pk_root.substring(0, 20) + '...');
  console.log('  - pk_match:', keys.pk_match.substring(0, 20) + '...');
  console.log('  - sk_match:', keys.sk_match.substring(0, 20) + '...');
}

/**
 * Get all wallet keys from localStorage
 */
export function getAllKeys(): {
  sk_root: string | null;
  pk_root: string | null;
  pk_match: string | null;
  sk_match: string | null;
} {
  if (typeof window === 'undefined') {
    console.warn('localStorage not available (server-side)');
    return { sk_root: null, pk_root: null, pk_match: null, sk_match: null };
  }

  return {
    sk_root: localStorage.getItem(SK_ROOT_KEY),
    pk_root: localStorage.getItem(PK_ROOT_KEY),
    pk_match: localStorage.getItem(PK_MATCH_KEY),
    sk_match: localStorage.getItem(SK_MATCH_KEY),
  };
}

/**
 * Save sk_root to localStorage
 */
export function saveSkRoot(skRoot: string): void {
  if (typeof window === 'undefined') {
    console.warn('localStorage not available (server-side)');
    return;
  }

  localStorage.setItem(SK_ROOT_KEY, skRoot);
  console.log('✅ sk_root saved to localStorage');
}

/**
 * Get sk_root from localStorage
 */
export function getSkRoot(): string | null {
  if (typeof window === 'undefined') {
    console.warn('localStorage not available (server-side)');
    return null;
  }

  const skRoot = localStorage.getItem(SK_ROOT_KEY);
  if (!skRoot) {
    console.warn('⚠️ No sk_root found in localStorage');
  }
  return skRoot;
}

/**
 * Clear all wallet keys from localStorage
 */
export function clearAllKeys(): void {
  if (typeof window === 'undefined') {
    console.warn('localStorage not available (server-side)');
    return;
  }

  localStorage.removeItem(SK_ROOT_KEY);
  localStorage.removeItem(PK_ROOT_KEY);
  localStorage.removeItem(PK_MATCH_KEY);
  localStorage.removeItem(SK_MATCH_KEY);
  console.log('🗑️ All wallet keys cleared from localStorage');
}

/**
 * Clear sk_root from localStorage (deprecated - use clearAllKeys)
 */
export function clearSkRoot(): void {
  clearAllKeys();
}

/**
 * Sign message using sk_root from localStorage (ethers wallet)
 * @param message - Message to sign
 * @returns Signature string
 */
export async function signMessageWithSkRoot(message: string): Promise<string> {
  const skRootStr = getSkRoot();

  if (!skRootStr) {
    throw new Error('sk_root not found in localStorage. Please initialize wallet first.');
  }

  // Convert sk_root string to bigint
  const skRoot = BigInt(skRootStr);

  // Derive private key from sk_root (mod SECP256K1_ORDER)
  const privateKey = skRoot % SECP256K1_ORDER;
  const privateKeyHex = ethers.toBeHex(privateKey, 32);

  // Create wallet from private key
  const wallet = new ethers.Wallet(privateKeyHex);

  console.log('🔐 Signing message with ethers wallet (from sk_root)...');
  console.log('  - Wallet address:', wallet.address);
  console.log('  - Message:', message.substring(0, 50) + '...');

  // Sign message
  const signature = await wallet.signMessage(message);

  console.log('✅ Message signed with ethers!');
  console.log('  - Signature:', signature.substring(0, 30) + '...');

  return signature;
}

/**
 * Get wallet address from sk_root in localStorage
 */
export function getWalletAddressFromSkRoot(): string | null {
  const skRootStr = getSkRoot();

  if (!skRootStr) {
    return null;
  }

  const skRoot = BigInt(skRootStr);
  const privateKey = skRoot % SECP256K1_ORDER;
  const privateKeyHex = ethers.toBeHex(privateKey, 32);
  const wallet = new ethers.Wallet(privateKeyHex);

  return wallet.address;
}