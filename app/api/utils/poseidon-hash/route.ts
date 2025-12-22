import { NextRequest, NextResponse } from "next/server";

let barretenberg: any = null;

async function getBarretenberg(): Promise<any> {
  if (!barretenberg) {
    const { BarretenbergSync } = await import("@aztec/bb.js");
    // @ts-ignore - BarretenbergSync.new() works at runtime despite TypeScript errors
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
 * POST /api/utils/poseidon-hash
 * Calculate Poseidon2 hash
 * Body params:
 *   - inputs: Array of strings or numbers to hash
 */
export async function POST(request: NextRequest) {
  try {
    const { inputs } = await request.json();

    if (!inputs || !Array.isArray(inputs)) {
      return NextResponse.json(
        { error: 'inputs array is required' },
        { status: 400 }
      );
    }

    const hash = await poseidon2Hash(inputs);

    return NextResponse.json({
      success: true,
      hash,
    });
  } catch (error) {
    console.error('Error calculating poseidon hash:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate hash',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
