import { useState } from 'react';

interface PublicInputs {
  initial_commitment: string;
}

interface Transfer {
  direction: number;
  token_index: number;
  amount: string;
}

interface OrderData {
  id: string;
  price: string;
  qty: string;
  side: number;
  token_in: number;
  token_out: number;
}

interface Order {
  operation_type: number;
  order_index: number;
  order_data: OrderData;
}

interface Operations {
  transfer?: Transfer;
  order?: Order;
}

interface VerifyProofParams {
  proof: string;
  publicInputs: PublicInputs;
  circuitName: string;
  wallet_address: string;
  randomness: string;
  operations?: Operations;
}

interface VerifyProofResponse {
  success: boolean;
  verified?: boolean;
  message?: string;
  error?: string;
}

export function useProof() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyProof = async ({
    proof,
    publicInputs,
    circuitName,
    wallet_address,
    randomness,
    operations = {
      transfer: {
        direction: 0,
        token_index: 0,
        amount: '100'
      },
      order: [

      ],
      // order: {
      //   operation_type: 0,
      //   order_index: 0,
      //   order_data: {
      //     id: "12345",
      //     price: "1000000000000000000",
      //     qty: "5000000000000000000",
      //     side: 0,
      //     token_in: 0,
      //     token_out: 1
      //   }
      // }
    }
  }: VerifyProofParams): Promise<VerifyProofResponse> => {
    setIsVerifying(true);
    setError(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4953';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/proofs/verify`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof,
          publicInputs,
          circuitName,
          wallet_address,
          randomness,
          operations
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsVerifying(false);
      return {
        success: true,
        verified: data.verified,
        ...data,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsVerifying(false);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    verifyProof,
    isVerifying,
    error,
  };
}