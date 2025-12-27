'use client';

import { useState } from 'react';
import crypto from 'crypto-js'; // Use crypto-js for browser
import { TOTAL_TOKEN, MAX_PENDING_ORDER } from '@/lib/constants';

/**
 * Client-side hook for wallet initialization proof generation
 * Based on /api/proof/generate-wallet-init but runs in browser
 */

let barretenberg: any = null;

async function getBarretenberg(): Promise<any> {
  if (!barretenberg) {
    const { BarretenbergSync } = await import("@aztec/bb.js");
    // @ts-ignore
    barretenberg = await BarretenbergSync.new();
  }
  return barretenberg;
}

async function poseidon2Hash(inputs: (string | bigint)[]): Promise<string> {
  const bb = await getBarretenberg();
  const { Fr } = await import("@aztec/bb.js");

  const fieldInputs = inputs.map(input => {
    const bigintValue = typeof input === 'string' ? BigInt(input) : input;
    return new Fr(bigintValue);
  });

  const result = bb.poseidon2Hash(fieldInputs);
  return result.toString();
}

/**
 * Compute wallet commitment (matches backend test file structure)
 *
 * Commitment = Poseidon2([
 *   availableHash,
 *   reservedHash,
 *   ordersHash,
 *   keysHash,
 *   fees,
 *   blinder
 * ])
 *
 * Where keysHash = Poseidon2([pkRoot, pkMatch, nonce])
 */
async function computeWalletCommitment(
  availableBalances: (bigint | string)[],
  reservedBalances: (bigint | string)[],
  ordersList: (bigint | string)[],
  fees: bigint | string,
  pkRoot: bigint | string,
  pkMatch: bigint | string,
  nonce: bigint | string,
  blinder: bigint | string
): Promise<string> {
  // Hash individual components
  const availableHash = await poseidon2Hash(availableBalances.map(b => b.toString()));
  const reservedHash = await poseidon2Hash(reservedBalances.map(b => b.toString()));
  const ordersHash = await poseidon2Hash(ordersList.map(o => o.toString()));

  // Hash keys (pk_root, pk_match, nonce)
  const keysHash = await poseidon2Hash([
    pkRoot.toString(),
    pkMatch.toString(),
    nonce.toString()
  ]);

  // Final commitment
  const commitment = await poseidon2Hash([
    availableHash,
    reservedHash,
    ordersHash,
    keysHash,
    fees.toString(),
    blinder.toString()
  ]);

  return commitment;
}

export function useGenerateWalletInit() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate wallet initialization proof
   * @param params - Wallet initialization parameters
   */
  async function generateWalletInit(params: {
    userSecret: string;
    blinder_seed: string;
    pk_root: string;
    pk_match: string;
    sk_match: string;  // ✅ Add sk_match
  }) {
    const { userSecret, blinder_seed, pk_root, pk_match, sk_match } = params;

    if (!userSecret || !blinder_seed) {
      return {
        success: false,
        error: 'userSecret and blinder_seed are required'
      };
    }

    setIsGenerating(true);
    setProgress('Initializing...');
    setError(null);

    const startTime = Date.now();
    console.log("🚀 Generating proof for wallet_init_state (CLIENT-SIDE)...");

    try {
      // ============================================
      // STEP 1: Load circuit
      // ============================================
      setProgress('Loading circuit...');

      // ✅ Import circuit directly (no fs needed)
      const circuit = await import('@/circuits/wallet_init_state.json');

      setProgress('Initializing Noir backend...');

      const { BarretenbergBackend } = await import("@noir-lang/backend_barretenberg");
      const { Noir } = await import("@noir-lang/noir_js");

      // Initialize Noir backend
      const backend = new BarretenbergBackend(circuit, { threads: 8 });
      const noir = new Noir(circuit);

      // Initialize Noir
      await noir.init();

      // ============================================
      // STEP 2: Calculate initial state
      // ============================================
      setProgress('Calculating initial state...');

      const initialNonce = '0';
      const emptyFees = '0';
      const emptyBalances = Array(TOTAL_TOKEN).fill('0');
      const emptyOrders = Array(MAX_PENDING_ORDER).fill('0');

      // Hash userSecret to ensure it fits within BN254 field modulus (254 bits)
      // ✅ Use crypto-js instead of Node.js crypto
      const hash = crypto.SHA256(String(userSecret)).toString();
      const user_secret = BigInt('0x' + hash.slice(0, 63)); // Take first 252 bits

      setProgress('Calculating commitment...');

      // ✅ Use computeWalletCommitment (matches backend test structure)
      // Convert pk_root address to BigInt
      const pkRootBigInt = BigInt(pk_root);

      const initialCommitment = await computeWalletCommitment(
        emptyBalances,           // available_balances
        emptyBalances,           // reserved_balances
        emptyOrders,             // orders_list (hashed)
        emptyFees,               // fees
        pkRootBigInt,            // pk_root (Ethereum address as BigInt)
        pk_match,        // pk_match
        initialNonce,    // nonce (0)
        blinder_seed     // blinder_seed
      );

      console.log('✅ Initial Commitment:', initialCommitment);
      console.log('✅ Using blinder_seed:', blinder_seed.substring(0, 20) + '...');
      console.log('✅ Using pk_root:', pk_root);
      console.log('✅ Using pk_match:', pk_match.substring(0, 20) + '...');

      // ============================================
      // STEP 3: Generate witness
      // ============================================
      setProgress('Generating witness...');

      const witnessStartTime = Date.now();

      // ✅ Circuit inputs match file test structure
      const inputs = {
        pk_root: pkRootBigInt.toString(),
        sk_match: sk_match.toString(),  // ✅ Use sk_match from params
        initial_blinder: blinder_seed.toString(),
        initial_commitment: initialCommitment,
      };

      console.log('📋 Circuit inputs:', {
        pk_root: inputs.pk_root.substring(0, 20) + '...',
        sk_match: inputs.sk_match.substring(0, 20) + '...',
        initial_blinder: inputs.initial_blinder.substring(0, 20) + '...',
        initial_commitment: inputs.initial_commitment.substring(0, 20) + '...',
      });

      const { witness } = await noir.execute(inputs);
      const witnessTime = Date.now() - witnessStartTime;
      console.log(`✅ Witness generation took ${witnessTime}ms`);

      // ============================================
      // STEP 4: Generate proof
      // ============================================
      setProgress('Generating proof (this may take 3-8 seconds)...');

      const proofGenStartTime = Date.now();
      const proof = await backend.generateProof(witness);
      const proofTime = Date.now() - proofGenStartTime;
      console.log(`✅ Proof generation took ${proofTime}ms`);

      // ============================================
      // STEP 5: Verify proof
      // ============================================
      setProgress('Verifying proof...');

      const verifyStartTime = Date.now();
      const verified = await backend.verifyProof({
        publicInputs: [initialCommitment],
        proof: proof.proof,
      });
      const verifyTime = Date.now() - verifyStartTime;
      console.log(`✅ Proof verification took ${verifyTime}ms`);
      console.log('✅ Proof verified:', verified);

      const totalTime = Date.now() - startTime;
      console.log(`✅ Total wallet_init_state proof generation: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);

      setIsGenerating(false);
      setProgress('');

      // ✅ Convert Uint8Array to hex string
      const proofHex = '0x' + Array.from(proof.proof)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return {
        success: true,
        verified,
        proof: proofHex,
        publicInputs: {
          initial_commitment: initialCommitment
        },
        randomness: blinder_seed,  // ✅ Return blinder_seed instead of initialRandomness
        new_state: {
          available_balances: emptyBalances,
          reserved_balances: emptyBalances,
          orders_list: Array(MAX_PENDING_ORDER).fill(null),
          fees: '0',
          nonce: '0',
        },
        timing: {
          total: totalTime,
          witness: witnessTime,
          proof: proofTime,
          verify: verifyTime,
        },
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error generating wallet init proof (CLIENT-SIDE):', err);
      setError(errorMessage);
      setIsGenerating(false);
      setProgress('');

      return {
        success: false,
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      };
    }
  }

  return {
    // States
    isGenerating,
    progress,
    error,

    // Functions
    generateWalletInit
  };
}