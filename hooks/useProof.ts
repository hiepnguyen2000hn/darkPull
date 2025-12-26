import { useState } from 'react';
import { TOTAL_TOKEN, MAX_PENDING_ORDER } from '@/lib/constants';

// ============================================
// TYPE DEFINITIONS FOR calculateNewState
// ============================================

// Wallet State Structure
export interface WalletState {
  available_balances: string[];  // Array of 10 token balances
  reserved_balances: string[];   // Array of 10 token balances
  orders_list: (OrderInState | null)[];  // Array of 4 orders
  fees: string;
}

// Order in state (without id, since id is only for API)
export interface OrderInState {
  price: string;
  qty: string;
  side: number;      // 0=BUY, 1=SELL
  token_in: number;
  token_out: number;
}

// Transfer Action
export interface TransferAction {
  type: 'transfer';
  direction: number;   // 0=DEPOSIT, 1=WITHDRAW
  token_index: number;
  amount: string;
  permit2Nonce?: string;
  permit2Deadline?: string;
  permit2Signature?: string;
}

// Order Action
export interface OrderAction {
  type: 'order';
  operation_type: number;  // 0=CREATE, 1=CANCEL
  order_index: number;
  order_data?: OrderInState;  // Required for CREATE, optional for CANCEL
}

// Combined Action (both transfer and order)
export interface CombinedAction {
  type: 'combined';
  transfer: Omit<TransferAction, 'type'>;
  order: Omit<OrderAction, 'type'>;
}

// Return Type
export interface CalculateNewStateResult {
  newState: WalletState;
  operations: Operations;
}

// ============================================
// EXISTING TYPE DEFINITIONS
// ============================================

interface PublicInputs {
  initial_commitment: string;
}

interface Transfer {
  direction: number;
  token_index: number;
  amount: string;
  permit2Nonce?: string;
  permit2Deadline?: string;
  permit2Signature?: string;
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
  signature?: string;
}

interface VerifyProofResponse {
  success: boolean;
  verified?: boolean;
  message?: string;
  error?: string;
}

// ============================================
// HELPER FUNCTIONS FOR calculateNewState
// ============================================

/**
 * Deep clone wallet state to avoid mutations
 */
function deepCloneState(state: WalletState): WalletState {
  return {
    available_balances: [...state.available_balances],
    reserved_balances: [...state.reserved_balances],
    orders_list: state.orders_list.map(order =>
      order === null ? null : { ...order }
    ),
    fees: state.fees
  };
}

/**
 * Validate wallet state structure
 */
function validateStateStructure(state: WalletState): void {
  if (!state || typeof state !== 'object') {
    throw new Error('[calculateNewState] Invalid state: state must be an object');
  }

  if (!Array.isArray(state.available_balances) ||
      state.available_balances.length !== TOTAL_TOKEN) {
    throw new Error(`[calculateNewState] Invalid state: available_balances must have exactly ${TOTAL_TOKEN} elements`);
  }

  if (!Array.isArray(state.reserved_balances) ||
      state.reserved_balances.length !== TOTAL_TOKEN) {
    throw new Error(`[calculateNewState] Invalid state: reserved_balances must have exactly ${TOTAL_TOKEN} elements`);
  }

  if (!Array.isArray(state.orders_list) ||
      state.orders_list.length !== MAX_PENDING_ORDER) {
    throw new Error(`[calculateNewState] Invalid state: orders_list must have exactly ${MAX_PENDING_ORDER} elements`);
  }

  // Validate all balances are numeric strings
  [...state.available_balances, ...state.reserved_balances, state.fees].forEach((balance, idx) => {
    if (typeof balance !== 'string' || !/^\d+$/.test(balance)) {
      throw new Error(`[calculateNewState] Invalid balance at index ${idx}: must be a numeric string`);
    }
  });
}

/**
 * Process transfer operation and update state
 */
function processTransfer(
  newState: WalletState,
  transfer: Omit<TransferAction, 'type'>,
  operations: Operations
): void {
  // Validate token_index
  if (typeof transfer.token_index !== 'number' ||
      transfer.token_index < 0 ||
      transfer.token_index >= TOTAL_TOKEN) {
    throw new Error(`[calculateNewState] Invalid token_index: must be between 0 and ${TOTAL_TOKEN - 1}`);
  }

  // Validate direction
  if (typeof transfer.direction !== 'number' ||
      (transfer.direction !== 0 && transfer.direction !== 1)) {
    throw new Error('[calculateNewState] Invalid direction: must be 0 (DEPOSIT) or 1 (WITHDRAW)');
  }

  // Validate amount
  const amount = BigInt(transfer.amount);
  if (amount <= 0n) {
    throw new Error('[calculateNewState] Invalid amount: must be greater than 0');
  }

  // Process DEPOSIT (direction=0)
  if (transfer.direction === 0) {
    const currentBalance = BigInt(newState.available_balances[transfer.token_index]);
    newState.available_balances[transfer.token_index] = (currentBalance + amount).toString();
  }
  // Process WITHDRAW (direction=1)
  else if (transfer.direction === 1) {
    // Validate fees must be 0 for withdrawal
    if (newState.fees !== '0') {
      throw new Error('[calculateNewState] Cannot withdraw: fees must be 0');
    }

    // Check sufficient balance
    const currentBalance = BigInt(newState.available_balances[transfer.token_index]);
    if (currentBalance < amount) {
      throw new Error(
        `[calculateNewState] Insufficient balance: have ${currentBalance}, need ${amount} for token ${transfer.token_index}`
      );
    }

    newState.available_balances[transfer.token_index] = (currentBalance - amount).toString();
  }

  // Build operations.transfer
  operations.transfer = {
    direction: transfer.direction,
    token_index: transfer.token_index,
    amount: transfer.amount,
    ...(transfer.permit2Nonce && { permit2Nonce: transfer.permit2Nonce }),
    ...(transfer.permit2Deadline && { permit2Deadline: transfer.permit2Deadline }),
    ...(transfer.permit2Signature && { permit2Signature: transfer.permit2Signature })
  };
}

/**
 * Process order operation and update state
 */
function processOrder(
  newState: WalletState,
  order: Omit<OrderAction, 'type'>,
  operations: Operations
): void {
  // Validate order_index
  if (typeof order.order_index !== 'number' ||
      order.order_index < 0 ||
      order.order_index >= MAX_PENDING_ORDER) {
    throw new Error(`[calculateNewState] Invalid order_index: must be between 0 and ${MAX_PENDING_ORDER - 1}`);
  }

  // Validate operation_type
  if (typeof order.operation_type !== 'number' ||
      (order.operation_type !== 0 && order.operation_type !== 1)) {
    throw new Error('[calculateNewState] Invalid operation_type: must be 0 (CREATE) or 1 (CANCEL)');
  }

  // Process CREATE order (operation_type=0)
  if (order.operation_type === 0) {
    if (!order.order_data) {
      throw new Error('[calculateNewState] order_data is required for CREATE operation');
    }

    // Validate order slot is empty
    if (newState.orders_list[order.order_index] !== null) {
      throw new Error(`[calculateNewState] Order slot ${order.order_index} is already occupied`);
    }

    const { price, qty, side, token_in, token_out } = order.order_data;

    // Validate order data
    const priceBI = BigInt(price);
    const qtyBI = BigInt(qty);

    if (priceBI <= 0n) {
      throw new Error('[calculateNewState] Invalid price: must be greater than 0');
    }
    if (qtyBI <= 0n) {
      throw new Error('[calculateNewState] Invalid qty: must be greater than 0');
    }
    if (token_in < 0 || token_in >= TOTAL_TOKEN) {
      throw new Error(`[calculateNewState] Invalid token_in: must be between 0 and ${TOTAL_TOKEN - 1}`);
    }
    if (token_out < 0 || token_out >= TOTAL_TOKEN) {
      throw new Error(`[calculateNewState] Invalid token_out: must be between 0 and ${TOTAL_TOKEN - 1}`);
    }
    if (token_in === token_out) {
      throw new Error('[calculateNewState] Invalid order: token_in and token_out must be different');
    }
    if (side !== 0 && side !== 1) {
      throw new Error('[calculateNewState] Invalid side: must be 0 (BUY) or 1 (SELL)');
    }

    // Calculate reservation amount based on side
    if (side === 0) {
      // BUY: reserve price * qty in token_in
      const reserveAmount = priceBI * qtyBI;
      const availableBalance = BigInt(newState.available_balances[token_in]);

      if (availableBalance < reserveAmount) {
        throw new Error(
          `[calculateNewState] Insufficient balance for BUY order: have ${availableBalance}, need ${reserveAmount} in token ${token_in}`
        );
      }

      // Move from available to reserved
      newState.available_balances[token_in] = (availableBalance - reserveAmount).toString();
      newState.reserved_balances[token_in] = (
        BigInt(newState.reserved_balances[token_in]) + reserveAmount
      ).toString();
    } else {
      // SELL: reserve qty in token_out
      const availableBalance = BigInt(newState.available_balances[token_out]);

      if (availableBalance < qtyBI) {
        throw new Error(
          `[calculateNewState] Insufficient balance for SELL order: have ${availableBalance}, need ${qtyBI} in token ${token_out}`
        );
      }

      // Move from available to reserved
      newState.available_balances[token_out] = (availableBalance - qtyBI).toString();
      newState.reserved_balances[token_out] = (
        BigInt(newState.reserved_balances[token_out]) + qtyBI
      ).toString();
    }

    // Add order to orders_list
    newState.orders_list[order.order_index] = { ...order.order_data };

    // Build operations.order for CREATE
    operations.order = {
      operation_type: 0,
      order_index: order.order_index,
      order_data: {
        id: generateOrderId(),
        ...order.order_data
      }
    };
  }
  // Process CANCEL order (operation_type=1)
  else if (order.operation_type === 1) {
    const existingOrder = newState.orders_list[order.order_index];

    if (existingOrder === null) {
      throw new Error(`[calculateNewState] No order found at index ${order.order_index} to cancel`);
    }

    const { price, qty, side, token_in, token_out } = existingOrder;
    const priceBI = BigInt(price);
    const qtyBI = BigInt(qty);

    // Release reserved balance based on side
    if (side === 0) {
      // BUY: release price * qty from reserved_balances[token_in]
      const releaseAmount = priceBI * qtyBI;
      newState.reserved_balances[token_in] = (
        BigInt(newState.reserved_balances[token_in]) - releaseAmount
      ).toString();
      newState.available_balances[token_in] = (
        BigInt(newState.available_balances[token_in]) + releaseAmount
      ).toString();
    } else {
      // SELL: release qty from reserved_balances[token_out]
      newState.reserved_balances[token_out] = (
        BigInt(newState.reserved_balances[token_out]) - qtyBI
      ).toString();
      newState.available_balances[token_out] = (
        BigInt(newState.available_balances[token_out]) + qtyBI
      ).toString();
    }

    // Remove order from orders_list
    newState.orders_list[order.order_index] = null;

    // Build operations.order for CANCEL
    operations.order = {
      operation_type: 1,
      order_index: order.order_index,
      order_data: {
        id: '0',
        price: existingOrder.price,
        qty: existingOrder.qty,
        side: existingOrder.side,
        token_in: existingOrder.token_in,
        token_out: existingOrder.token_out
      }
    };
  }
}

/**
 * Generate unique order ID
 */
function generateOrderId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// ============================================
// MAIN FUNCTION: calculateNewState
// ============================================

/**
 * Calculate new wallet state from an action (transfer/order/both)
 *
 * @param oldState - Current wallet state
 * @param action - Action to apply (transfer, order, or combined)
 * @returns New state and operations object ready for proof verification
 *
 * @throws Error if validation fails or insufficient balance
 *
 * @example
 * // Deposit example
 * const { newState, operations } = calculateNewState(oldState, {
 *   type: 'transfer',
 *   direction: 0,
 *   token_index: 0,
 *   amount: '100000000'
 * });
 *
 * @example
 * // Create order example
 * const { newState, operations } = calculateNewState(oldState, {
 *   type: 'order',
 *   operation_type: 0,
 *   order_index: 0,
 *   order_data: {
 *     price: '1',
 *     qty: '100',
 *     side: 0,
 *     token_in: 1,
 *     token_out: 0
 *   }
 * });
 */
export function calculateNewState(
  oldState: WalletState,
  action: TransferAction | OrderAction | CombinedAction
): CalculateNewStateResult {
  // Step 1: Validate state structure
  validateStateStructure(oldState);

  // Step 2: Deep clone state to avoid mutations
  const newState = deepCloneState(oldState);

  // Step 3: Initialize operations object
  const operations: Operations = {};

  // Step 4: Process action based on type
  if (action.type === 'transfer') {
    processTransfer(newState, action, operations);
  } else if (action.type === 'order') {
    processOrder(newState, action, operations);
  } else if (action.type === 'combined') {
    processTransfer(newState, action.transfer, operations);
    processOrder(newState, action.order, operations);
  } else {
    throw new Error(`[calculateNewState] Invalid action type: ${(action as any).type}`);
  }

  // Step 5: Return result
  return { newState, operations };
}

// ============================================
// HOOK: useProof
// ============================================

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
    },
    signature
  }: VerifyProofParams): Promise<VerifyProofResponse> => {
    setIsVerifying(true);
    setError(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4953';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/proofs/update-wallet`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof,
          publicInputs,
          // circuitName,
          wallet_address,
          randomness,
          operations,
          signature
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
    calculateNewState,
  };
}