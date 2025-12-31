import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Barretenberg will be loaded dynamically
let barretenberg: any = null;
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
 * Derive sk_root from Ethereum wallet using EIP-712 signing
 * Domain: "Renegade Auth"
 * Message: "Renegade Authentication"
 */
async function deriveSkRoot(wallet: ethers.Wallet, chainId: number): Promise<bigint> {
  const domain = {
    name: "Renegade Auth",
    version: "1",
    chainId: chainId,
  };

  const types = {
    Auth: [{ name: "message", type: "string" }],
  };

  const value = {
    message: "Zenigma Authentication",
  };

  const signature = await wallet.signTypedData(domain, types, value);
  const sigBytes = ethers.getBytes(signature);

  // Hash with keccak256 and take first 31 bytes (248 bits) to fit in BN254 field
  const hash = ethers.keccak256(sigBytes);
  const hashBytes = ethers.getBytes(hash);
  const truncated = hashBytes.slice(0, 31); // 248 bits
  const skRoot = BigInt(ethers.hexlify(truncated));
  const skRootMasked = ethers.hexlify(truncated)
  console.log(skRootMasked, 'skRootMasked')
  return skRoot;
}

/**
 * Derive pk_root from sk_root using Poseidon2 hash
 */
async function derivePkRoot(skRoot: bigint, bb?: any, Fr?: any): Promise<bigint> {
  const hash = await poseidon2Hash([skRoot], bb, Fr);
  return BigInt(hash);
}

/**
 * Derive sk_match from sk_root and chainId using Poseidon2
 */
async function deriveSkMatch(skRoot: bigint, chainId: number, bb?: any, Fr?: any): Promise<bigint> {
  const hash = await poseidon2Hash([skRoot, BigInt(chainId)], bb, Fr);
  return BigInt(hash);
}

/**
 * Derive pk_match from sk_match using Poseidon2 hash
 */
async function derivePkMatch(skMatch: bigint, bb?: any, Fr?: any): Promise<bigint> {
  const hash = await poseidon2Hash([skMatch], bb, Fr);
  return BigInt(hash);
}

/**
 * Derive symmetric encryption key from sk_root
 */
async function deriveSymmetricKey(skRoot: bigint): Promise<Uint8Array> {
  // Convert sk_root to bytes (32 bytes, big-endian)
  const skRootHex = skRoot.toString(16).padStart(64, '0');
  const skRootBytes = ethers.getBytes('0x' + skRootHex);

  // Hash with keccak256 to get 32-byte symmetric key
  const keyHash = ethers.keccak256(skRootBytes);
  return ethers.getBytes(keyHash);
}

/**
 * Derive blinder seed from sk_root for note commitment randomness
 */
async function deriveBlinderSeed(skRoot: bigint, bb?: any, Fr?: any): Promise<bigint> {
  // Use Poseidon2 with a constant to derive blinder seed
  const BLINDER_DOMAIN_TAG = BigInt("0x424c494e444552"); // "BLINDER" in hex
  const hash = await poseidon2Hash([skRoot, BLINDER_DOMAIN_TAG], bb, Fr);
  return BigInt(hash);
}

/**
 * Derive all keys from an Ethereum wallet
 */
async function deriveAllKeys(wallet: ethers.Wallet, chainId: number) {
  console.log('🔐 Starting key derivation...');
  const startTime = Date.now();

  // Pre-load Barretenberg for better performance
  const bb = await getBarretenberg();
  const Fr = await getFrClass();

  // Step 1: Derive sk_root (most expensive step - EIP-712 signing)
  console.log('  Step 1/6: Deriving sk_root via EIP-712...');
  const skRoot = await deriveSkRoot(wallet, chainId);
  console.log(`  ✓ sk_root derived: ${skRoot.toString().substring(0, 20)}...`);

  // Step 2-6: Derive all other keys in parallel where possible
  console.log('  Step 2-6: Deriving other keys...');
  const [pkRoot, skMatch, symmetricKey, blinderSeed] = await Promise.all([
    derivePkRoot(skRoot, bb, Fr),
    deriveSkMatch(skRoot, chainId, bb, Fr),
    deriveSymmetricKey(skRoot),
    deriveBlinderSeed(skRoot, bb, Fr)
  ]);

  // Step 7: Derive pk_match (depends on sk_match)
  const pkMatch = await derivePkMatch(skMatch, bb, Fr);

  const totalTime = Date.now() - startTime;
  console.log(`✓ All keys derived in ${totalTime}ms`);

  return {
    sk_root: skRoot.toString(),
    pk_root: pkRoot.toString(),
    sk_match: skMatch.toString(),
    pk_match: pkMatch.toString(),
    symmetric_key: ethers.hexlify(symmetricKey),
    blinder_seed: blinderSeed.toString(),
  };
}

/**
 * POST /api/proof/generate-wallet-init-v2
 * Generate wallet keys using ethers.js-based derivation
 */
export async function POST(request: NextRequest) {
  try {
    const { privateKey, chainId } = await request.json();

    // Validate inputs
    if (!privateKey) {
      return NextResponse.json(
        { error: 'privateKey is required' },
        { status: 400 }
      );
    }

    if (!chainId || typeof chainId !== 'number') {
      return NextResponse.json(
        { error: 'chainId must be a valid number' },
        { status: 400 }
      );
    }

    console.log(`\n🚀 Generating wallet keys for chainId: ${chainId}`);
    const startTime = Date.now();

    // Create wallet from private key
    let wallet: ethers.Wallet;
    console.log(wallet, 'wallet---------------------')
    try {
      wallet = new ethers.Wallet(privateKey);
      console.log(`📍 Wallet address: ${wallet.address}`);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid private key format' },
        { status: 400 }
      );
    }

    // Derive all keys
    const keys = await deriveAllKeys(wallet, chainId);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Total key derivation completed in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)\n`);
    console.log(keys, 'key------------------------------------')
    return NextResponse.json({
      success: true,
      wallet_address: wallet.address,
      chainId,
      keys,
      timing: {
        total_ms: totalTime,
        total_seconds: (totalTime / 1000).toFixed(2)
      }
    });

  } catch (error) {
    console.error('❌ Error generating wallet keys:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate wallet keys',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
