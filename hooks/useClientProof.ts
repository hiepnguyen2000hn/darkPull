'use client';

import { useState } from 'react';
import {
  poseidon2HashClient,
  calculateWalletCommitment,
  calculateRandomness,
  deriveAllKeysFromSkRoot,
  deriveSkRootFromSignature
} from '@/lib/client-crypto';

/**
 * Hook for client-side proof generation using Noir and Barretenberg
 */
export function useClientProof() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate wallet initialization proof (client-side)
   */
  async function generateInitProofClient(userSecret: string) {
    setIsGenerating(true);
    setProgress('Initializing...');
    setError(null);

    try {
      setProgress('Loading circuit...');

      // ✅ Dynamic import for code splitting
      const { Noir } = await import('@noir-lang/noir_js');
      const { BarretenbergBackend } = await import('@noir-lang/backend_barretenberg');

      setProgress('Loading circuit file...');

      // ✅ Import circuit directly (better than fetch - bundled by webpack)
      const circuit = await import('@/circuits/wallet_init_state.json');

      setProgress('Initializing backend...');

      // Initialize backend and Noir
      const backend = new BarretenbergBackend(circuit, { threads: 8 });
      const noir = new Noir(circuit);
      await noir.init();

      setProgress('Calculating initial commitment...');

      // Calculate initial state
      const nonce = '0';
      const availableBalances = Array(10).fill('0');
      const reservedBalances = Array(10).fill('0');
      const ordersList = Array(4).fill(null);
      const fees = '0';

      // Calculate randomness
      const randomness = await calculateRandomness(userSecret, nonce);

      // Calculate initial commitment
      const initialCommitment = await calculateWalletCommitment(
        availableBalances,
        reservedBalances,
        ordersList,
        fees,
        randomness
      );

      setProgress('Generating witness...');

      // Generate witness
      const inputs = {
        user_secret: userSecret,
        nonce,
        available_balances: availableBalances,
        reserved_balances: reservedBalances,
        orders_list: ordersList.map(() => '0'), // Order hashes
        fees
      };

      const { witness } = await noir.execute(inputs);

      setProgress('Generating proof (this may take 3-8 seconds)...');

      // Generate proof
      const { proof, publicInputs } = await backend.generateProof(witness);

      setProgress('Proof generated!');

      setIsGenerating(false);
      setProgress('');

      return {
        success: true,
        proof: Buffer.from(proof).toString('hex'),
        publicInputs: {
          initial_commitment: initialCommitment
        },
        randomness
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Client-side proof generation error:', err);
      setError(errorMessage);
      setIsGenerating(false);
      setProgress('');

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Derive keys from EIP-712 signature (client-side)
   */
  async function deriveKeysFromSignature(signature: string, chainId: number) {
    setIsGenerating(true);
    setProgress('Deriving sk_root from signature...');
    setError(null);

    try {
      // Derive sk_root from signature
      const skRoot = deriveSkRootFromSignature(signature);

      setProgress('Deriving cryptographic keys...');

      // Derive all keys
      const keys = await deriveAllKeysFromSkRoot(skRoot, chainId);
      console.log(keys, 'keys derived from signature');
      setIsGenerating(false);
      setProgress('');

      return {
        success: true,
        keys
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Key derivation error:', err);
      setError(errorMessage);
      setIsGenerating(false);
      setProgress('');

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Full wallet initialization flow (client-side)
   * Signs EIP-712 → Derives keys → Generates proof
   */
  async function initializeWalletClient(signature: string, chainId: number) {
    setIsGenerating(true);
    setError(null);

    try {
      // STEP 1: Derive keys from signature
      setProgress('Step 1/2: Deriving keys...');
      const keysResult = await deriveKeysFromSignature(signature, chainId);

      if (!keysResult.success || !keysResult.keys) {
        throw new Error(keysResult.error || 'Failed to derive keys');
      }

      // STEP 2: Generate proof
      setProgress('Step 2/2: Generating proof...');
      const proofResult = await generateInitProofClient(keysResult.keys.sk_root);

      if (!proofResult.success) {
        throw new Error(proofResult.error || 'Failed to generate proof');
      }

      setIsGenerating(false);
      setProgress('');

      return {
        success: true,
        keys: keysResult.keys,
        proof: proofResult.proof,
        publicInputs: proofResult.publicInputs,
        randomness: proofResult.randomness
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Wallet initialization error:', err);
      setError(errorMessage);
      setIsGenerating(false);
      setProgress('');

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  return {
    // States
    isGenerating,
    progress,
    error,

    // Functions
    generateInitProofClient,
    deriveKeysFromSignature,
    initializeWalletClient
  };
}