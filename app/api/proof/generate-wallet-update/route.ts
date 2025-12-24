import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { toHex } from "viem";
import { CIRCUITS_DIR } from "@/lib/server-constants";
import { TOTAL_TOKEN, MAX_PENDING_ORDER } from "@/lib/constants";
import { publicInputsToObject } from "@/lib/wallet-utils";

const ORDER_OPERATION_TYPE = {
  OP_CREATE_ORDER: '0',
  OP_CANCEL_ORDER: '1',
};

const ORDER_DIRECTION = {
  BUY: '0',
  SELL: '1',
};

const GLOBAL_DEPTH = 16;

let barretenberg: any = null;
let cachedCircuit: any = null;
let cachedBackend: any = null;
let cachedNoir: any = null;
let FrClass: any = null;

async function getBarretenberg(): Promise<any> {
  if (!barretenberg) {
    const { BarretenbergSync } = await import("@aztec/bb.js");
    // @ts-ignore
    barretenberg = await BarretenbergSync.new();
  }
  return barretenberg;
}

async function getFrClass(): Promise<any> {
  if (!FrClass) {
    const { Fr } = await import("@aztec/bb.js");
    FrClass = Fr;
  }
  return FrClass;
}

async function poseidon2Hash(inputs: (string | bigint)[], bb?: any, Fr?: any): Promise<string> {
  const barretenberg = bb || await getBarretenberg();
  const FrCls = Fr || await getFrClass();

  const fieldInputs = inputs.map(input => {
    const bigintValue = typeof input === 'string' ? BigInt(input) : input;
    return new FrCls(bigintValue);
  });

  const result = barretenberg.poseidon2Hash(fieldInputs);
  return result.toString();
}

/**
 * Calculate merkle root from leaf commitment and sibling paths
 * Optimized version with batch hashing
 */
async function computeMerkleRoot(
  commitment: string | bigint,
  index: number,
  hashPath: (string | bigint)[],
  bb?: any,
  Fr?: any
): Promise<string> {
  if (hashPath.length !== GLOBAL_DEPTH) {
    throw new Error(`Hash path must have exactly ${GLOBAL_DEPTH} elements, got ${hashPath.length}`);
  }

  let hash = commitment;

  // Process in batches for better performance
  for (let i = 0; i < GLOBAL_DEPTH; i++) {
    const isRight = ((index >> i) & 1) === 1;
    hash = await poseidon2Hash(
      isRight ? [hash, hashPath[i]] : [hashPath[i], hash],
      bb,
      Fr
    );
  }

  return hash.toString();
}

/**
 * POST /api/proof/generate-wallet-update
 * Generate zero-knowledge proof for wallet update
 */
export async function POST(request: NextRequest) {
  try {
    const {
      userSecret,
      oldNonce,
      oldMerkleRoot,
      oldMerkleIndex,
      oldHashPath,
      oldState,
      newState
    } = await request.json();

    if (!userSecret || !oldState || !newState) {
      return NextResponse.json(
        { error: 'userSecret, oldState, and newState are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    console.log("Generating proof for wallet_update_state...", CIRCUITS_DIR);

    // Load circuit (with caching)
    if (!cachedCircuit) {
      const circuitPath = path.join(CIRCUITS_DIR, "wallet_update_state.json");

      try {
        await fs.access(circuitPath);
      } catch {
        return NextResponse.json(
          {
            error: "Circuit file not found",
            message: `Please ensure wallet_update_state.json exists in ${CIRCUITS_DIR}`,
          },
          { status: 500 }
        );
      }

      cachedCircuit = JSON.parse(await fs.readFile(circuitPath, 'utf8'));
      console.log("Circuit loaded and cached");
    }

    // Initialize backend and noir (with caching)
    if (!cachedBackend || !cachedNoir) {
      const { BarretenbergBackend } = await import("@noir-lang/backend_barretenberg");
      const { Noir } = await import("@noir-lang/noir_js");

      cachedBackend = new BarretenbergBackend(cachedCircuit, { threads: 16 });
      cachedNoir = new Noir(cachedCircuit);

      await cachedNoir.init();
      console.log("Backend and Noir initialized and cached");
    }

    const backend = cachedBackend;
    const noir = cachedNoir;

    // Pre-load bb and Fr for performance
    const bb = await getBarretenberg();
    const Fr = await getFrClass();

    const newNonce = BigInt(oldNonce) + 1n;

    // Hash userSecret
    const hash = crypto.createHash('sha256').update(String(userSecret), 'utf-8').digest('hex');
    const user_secret = BigInt('0x' + hash.slice(0, 63));

    // Calculate old state commitment (parallel hashing)
    const [oldAvailableBalancesHash, oldReservedBalancesHash, oldOrdersHashes, newAvailableBalancesHash, newReservedBalancesHash, newOrdersHashes] = await Promise.all([
      poseidon2Hash(oldState.available_balances, bb, Fr),
      poseidon2Hash(oldState.reserved_balances, bb, Fr),
      Promise.all(
        oldState.orders_list.map(async (order: any) => {
          if (order === null) return '0';
          return await poseidon2Hash([
            BigInt(order.id || '0'),
            BigInt(order.price || '0'),
            BigInt(order.qty || '0'),
            BigInt(order.side || '0'),
            BigInt(order.token_in || '0'),
            BigInt(order.token_out || '0'),
          ], bb, Fr);
        })
      ),
      poseidon2Hash(newState.available_balances, bb, Fr),
      poseidon2Hash(newState.reserved_balances, bb, Fr),
      Promise.all(
        newState.orders_list.map(async (order: any) => {
          if (order === null) return '0';
          return await poseidon2Hash([
            BigInt(order.id || '0'),
            BigInt(order.price || '0'),
            BigInt(order.qty || '0'),
            BigInt(order.side || '0'),
            BigInt(order.token_in || '0'),
            BigInt(order.token_out || '0'),
          ], bb, Fr);
        })
      )
    ]);

    console.log(oldOrdersHashes, 'oldOrdersHashes');

    const [oldOrdersRoot, oldRandomness, newOrdersRoot, newRandomness] = await Promise.all([
      poseidon2Hash(oldOrdersHashes, bb, Fr),
      poseidon2Hash([user_secret, oldNonce], bb, Fr),
      poseidon2Hash(newOrdersHashes, bb, Fr),
      poseidon2Hash([user_secret, newNonce], bb, Fr)
    ]);

    const oldCommitment = await poseidon2Hash([
      oldAvailableBalancesHash,
      oldReservedBalancesHash,
      oldOrdersRoot,
      oldState.fees,
      oldRandomness,
    ], bb, Fr);

    // Verify old merkle root and calculate nullifier in parallel
    const [calculatedOldRoot, nullifier] = await Promise.all([
      computeMerkleRoot(
        oldCommitment,
        Number(oldMerkleIndex),
        oldHashPath,
        bb,
        Fr
      ),
      poseidon2Hash([user_secret, oldCommitment], bb, Fr)
    ]);

    console.log('Old Commitment:', oldCommitment);
    console.log('Calculated Old Root:', calculatedOldRoot);

    // Calculate new commitment (hashes already computed above)
    const newCommitment = await poseidon2Hash([
      newAvailableBalancesHash,
      newReservedBalancesHash,
      newOrdersRoot,
      newState.fees,
      newRandomness,
    ], bb, Fr);

    console.log('New Commitment:', newCommitment);
    console.log('Nullifier:', nullifier);

    const transfer_mint = '0';

    // Prepare circuit inputs (hardcoded for deposit 100 only, no order)
    const inputs = {
      // Public inputs
      old_wallet_commitment: oldCommitment,
      new_wallet_commitment: newCommitment,
      old_merkle_root: calculatedOldRoot,
      transfer_direction: '0', // 0: deposit, 1: withdraw
      transfer_mint: transfer_mint, // token index for the transfer
      transfer_amount: '100', // Must match the actual deposit amount
      operation_type: '0', // 0: transfer only, 1: order only, 2: both

      // Private inputs
      user_secret: user_secret.toString(),
      nonce: oldNonce.toString(),

      // Old state
      old_available_balances: oldState.available_balances.map((b: any) => b.toString()),
      old_reserved_balances: oldState.reserved_balances.map((b: any) => b.toString()),
      old_orders_list: oldOrdersHashes.map((h: any) => h.toString()),
      old_fees: oldState.fees.toString(),
      old_index: oldMerkleIndex.toString(),
      old_hash_path: oldHashPath,

      // New state
      new_available_balances: newState.available_balances.map((b: any) => b.toString()),
      new_reserved_balances: newState.reserved_balances.map((b: any) => b.toString()),
      new_orders_list: newOrdersHashes.map((h: any) => h.toString()),

      // Operation-specific fields (transfer only, no order)
      transfer_index: transfer_mint, // MUST match transfer_mint
      order_index: '0',
      order_direction: '0',
      order_price: '0',
      order_quantity: '0',
      order_token_in: '0',
      order_token_out: '0',
      order_operation_type: '0',
    };

    // Generate witness
    const witnessStartTime = Date.now();
    const { witness } = await noir.execute(inputs);
    const witnessTime = Date.now() - witnessStartTime;
    console.log(`Witness generation took ${witnessTime}ms`);

    // Generate proof
    const proofGenStartTime = Date.now();
    const { proof, publicInputs } = await backend.generateProof(witness);
    const proofTime = Date.now() - proofGenStartTime;
    console.log(`Proof generation took ${proofTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`Total wallet_update_state proof generation: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);

    // Convert publicInputs array to named object
    const namedPublicInputs = publicInputsToObject('wallet_update_state', publicInputs);

    // Build operations object for verification (transfer only)
    const operations = {
      transfer: {
        direction: 0,
        token_index: 0,
        amount: '100'
      },
      order: [],
      operation_type: 0 // Transfer only
    };

    return NextResponse.json({
      success: true,
      proof: toHex(proof),
      publicInputs: namedPublicInputs,
      randomness: newRandomness,
      operations: operations, // Return operations for verification
      new_state: {
        available_balances: newState.available_balances.map((b: any) => b.toString()),
        reserved_balances: newState.reserved_balances.map((b: any) => b.toString()),
        orders_list: newState.orders_list,
        fees: newState.fees.toString(),
        nonce: newNonce.toString(),
      }
    });
  } catch (error) {
    console.error('Error generating wallet update proof:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate proof',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}