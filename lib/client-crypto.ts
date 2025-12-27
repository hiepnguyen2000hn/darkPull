'use client';

import { ethers } from 'ethers';

/**
 * Client-side cryptographic utilities for wallet initialization
 * Based on test file - uses ECDSA wallet approach
 */

const BN254_FIELD_MODULUS = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
const SECP256K1_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

// Cached Barretenberg instance for performance
let barretenberg: any = null;
let FrClass: any = null;

/**
 * Initialize Barretenberg (lazy loading)
 */
async function getBarretenberg(): Promise<any> {
  if (!barretenberg) {
    console.log('🔧 Initializing Barretenberg (client-side)...');
    const { BarretenbergSync } = await import('@aztec/bb.js');
    // @ts-ignore
    barretenberg = await BarretenbergSync.new();
    console.log('✅ Barretenberg initialized');
  }
  return barretenberg;
}

/**
 * Get Fr class (lazy loading)
 */
async function getFrClass(): Promise<any> {
  if (!FrClass) {
    const { Fr } = await import('@aztec/bb.js');
    FrClass = Fr;
  }
  return FrClass;
}

/**
 * Poseidon2 hash on client-side
 */
export async function poseidon2HashClient(inputs: (string | bigint)[]): Promise<string> {
  const bb = await getBarretenberg();
  const Fr = await getFrClass();

  const fieldInputs = inputs.map(input => {
    const bigintValue = typeof input === 'string' ? BigInt(input) : input;
    return new Fr(bigintValue);
  });

  const result = bb.poseidon2Hash(fieldInputs);
  return result.toString();
}

/**
 * Derive sk_root from signature (client-side)
 * Converts EIP-712 signature to sk_root
 */
export function deriveSkRootFromSignature(signature: string): bigint {
  const sigBytes = ethers.getBytes(signature);
  const hash = ethers.keccak256(sigBytes);
  const hashBytes = ethers.getBytes(hash);

  // Extend to 64 bytes
  const extended = new Uint8Array(64);
  extended.set(hashBytes, 0);
  extended.set(hashBytes, 32);

  const sk_root = BigInt('0x' + Buffer.from(extended).toString('hex')) % BN254_FIELD_MODULUS;
  return sk_root;
}

/**
 * Derive pk_root from sk_root using ECDSA wallet
 * Returns both public key and Ethereum address
 */
export function derivePkRoot(sk_root: bigint): {
  publicKey: string;
  address: string;
} {
  const privateKey = sk_root % SECP256K1_ORDER;
  const privateKeyHex = ethers.toBeHex(privateKey, 32); // ethers v6
  const wallet = new ethers.Wallet(privateKeyHex);
  const publicKey = wallet.publicKey;
  const address = wallet.address;

  return { publicKey, address };
}

/**
 * Derive sk_match from sk_root by signing "match key"
 */
export async function deriveSkMatch(sk_root: bigint): Promise<bigint> {
  const privateKey = sk_root % SECP256K1_ORDER;
  const privateKeyHex = ethers.toBeHex(privateKey, 32);
  const sk_root_wallet = new ethers.Wallet(privateKeyHex);

  const message = 'match key';
  const signature = await sk_root_wallet.signMessage(message);

  // Parse signature (ethers v6)
  const sig = ethers.Signature.from(signature);
  const r_bytes = ethers.getBytes(sig.r);
  const s_bytes = ethers.getBytes(sig.s);
  const v_byte = sig.v;

  const sigBytes = new Uint8Array([...r_bytes, ...s_bytes, v_byte]);
  const hash = ethers.keccak256(sigBytes);

  const hashBytes = ethers.getBytes(hash);
  const extended = new Uint8Array(64);
  extended.set(hashBytes, 0);
  extended.set(hashBytes, 32);

  const sk_match = BigInt('0x' + Buffer.from(extended).toString('hex')) % BN254_FIELD_MODULUS;
  return sk_match;
}

/**
 * Derive pk_match from sk_match using Poseidon2
 */
export async function derivePkMatch(sk_match: bigint): Promise<bigint> {
  const pk_match_str = await poseidon2HashClient([sk_match]);
  const pk_match = BigInt(pk_match_str);
  return pk_match;
}

/**
 * Derive symmetric encryption key from sk_root by signing "symmetric key"
 */
export async function deriveSymmetricKey(sk_root: bigint): Promise<string> {
  const privateKey = sk_root % SECP256K1_ORDER;
  const privateKeyHex = ethers.toBeHex(privateKey, 32);
  const wallet = new ethers.Wallet(privateKeyHex);

  const message = 'symmetric key';
  const signature = await wallet.signMessage(message);
  const symmetric_key = signature.slice(0, 66); // First 66 chars (0x + 64 hex)

  return symmetric_key;
}

/**
 * Derive blinder seed from sk_root by signing "blinder seed"
 */
export async function deriveBlinderSeed(sk_root: bigint): Promise<bigint> {
  const privateKey = sk_root % SECP256K1_ORDER;
  const privateKeyHex = ethers.toBeHex(privateKey, 32);
  const wallet = new ethers.Wallet(privateKeyHex);

  const message = 'blinder seed';
  const signature = await wallet.signMessage(message);

  // Parse signature (ethers v6)
  const sig = ethers.Signature.from(signature);
  const r_bytes = ethers.getBytes(sig.r);
  const s_bytes = ethers.getBytes(sig.s);
  const v_byte = sig.v;

  const sigBytes = new Uint8Array([...r_bytes, ...s_bytes, v_byte]);
  const hash = ethers.keccak256(sigBytes);

  const hashBytes = ethers.getBytes(hash);
  const extended = new Uint8Array(64);
  extended.set(hashBytes, 0);
  extended.set(hashBytes, 32);

  const blinder_seed = BigInt('0x' + Buffer.from(extended).toString('hex')) % BN254_FIELD_MODULUS;
  return blinder_seed;
}

/**
 * Derive all keys from sk_root (client-side)
 * Matches test file structure
 */
export async function deriveAllKeysFromSkRoot(
  skRoot: bigint,
  chainId: number
): Promise<{
  sk_root: string;
  pk_root: { publicKey: string; address: string };
  sk_match: string;
  pk_match: string;
  symmetric_key: string;
  blinder_seed: string;
}> {
  console.log('🔑 Deriving all keys from sk_root (client-side)...');
  const startTime = Date.now();

  // Derive all keys
  const pk_root = derivePkRoot(skRoot);
  const sk_match = await deriveSkMatch(skRoot);
  const pk_match = await derivePkMatch(sk_match);
  const symmetric_key = await deriveSymmetricKey(skRoot);
  const blinder_seed = await deriveBlinderSeed(skRoot);

  const totalTime = Date.now() - startTime;
  console.log(`✅ All keys derived in ${totalTime}ms`);

  return {
    sk_root: skRoot.toString(),
    pk_root, // Object với publicKey và address
    sk_match: sk_match.toString(),
    pk_match: pk_match.toString(),
    symmetric_key, // Hex string
    blinder_seed: blinder_seed.toString()
  };
}

/**
 * Hash user secret to fit within BN254 field modulus
 */
export async function hashUserSecret(userSecret: string): Promise<bigint> {
  // Create SHA256 hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(userSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Take first 63 hex chars (252 bits) to fit in BN254 field
  return BigInt('0x' + hashHex.slice(0, 63));
}

/**
 * Calculate wallet commitment (client-side)
 */
export async function calculateWalletCommitment(
  availableBalances: string[],
  reservedBalances: string[],
  ordersList: any[],
  fees: string,
  randomness: string
): Promise<string> {
  // Hash balances
  const availableBalancesHash = await poseidon2HashClient(availableBalances);
  const reservedBalancesHash = await poseidon2HashClient(reservedBalances);

  // Hash orders
  const ordersHashes = await Promise.all(
    ordersList.map(async (order) => {
      if (order === null) return '0';
      return await poseidon2HashClient([
        order.price || '0',
        order.qty || '0',
        order.side?.toString() || '0',
        order.token_in?.toString() || '0',
        order.token_out?.toString() || '0',
      ]);
    })
  );
  const ordersRoot = await poseidon2HashClient(ordersHashes);

  // Calculate commitment
  const commitment = await poseidon2HashClient([
    availableBalancesHash,
    reservedBalancesHash,
    ordersRoot,
    fees,
    randomness,
  ]);

  return commitment;
}

/**
 * Calculate randomness from user secret and nonce
 */
export async function calculateRandomness(
  userSecret: string,
  nonce: string
): Promise<string> {
  const hashedSecret = await hashUserSecret(userSecret);
  const randomness = await poseidon2HashClient([hashedSecret, nonce]);
  return randomness;
}

/**
 * Calculate nullifier
 */
export async function calculateNullifier(
  userSecret: string,
  oldCommitment: string
): Promise<string> {
  const hashedSecret = await hashUserSecret(userSecret);
  const nullifier = await poseidon2HashClient([hashedSecret, oldCommitment]);
  return nullifier;
}