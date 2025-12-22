import { TOTAL_TOKEN, MAX_PENDING_ORDER } from './constants';

/**
 * Call API to calculate Poseidon2 hash
 */
export async function poseidon2HashClient(inputs: (string | bigint)[]): Promise<string> {
  const response = await fetch('/api/utils/poseidon-hash', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: inputs.map(i => i.toString()),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to calculate hash: ${response.status}`);
  }

  const data = await response.json();
  return data.hash;
}

/**
 * Hash user secret to fit within BN254 field modulus (browser-compatible)
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
 * Calculate wallet commitment
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
        order.id || '0',
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

/**
 * Generate wallet update proof (auto-detect operations from state changes)
 */
export async function generateWalletUpdateProof(
  userSecret: string,
  oldNonce: string,
  oldMerkleRoot: string,
  oldMerkleIndex: number | string,
  oldHashPath: string[],
  oldState: {
    available_balances: string[];
    reserved_balances: string[];
    orders_list: any[];
    fees: string;
  },
  newState: {
    available_balances: string[];
    reserved_balances: string[];
    orders_list: any[];
    fees: string;
  }
): Promise<{
  success: boolean;
  verified: boolean;
  proof: string;
  publicInputs: any;
  randomness: string;
  operations: any;
  new_state: any;
  timing?: any;
}> {
  // Call API to generate proof (API will auto-detect operations from state changes)
  const response = await fetch('/api/proof/generate-wallet-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userSecret,
      oldNonce,
      oldMerkleRoot,
      oldMerkleIndex,
      oldHashPath,
      oldState,
      newState,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to generate proof: ${response.status}`);
  }

  return await response.json();
}
