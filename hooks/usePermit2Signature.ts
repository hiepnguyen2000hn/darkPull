// usePermit2Signature.ts
import {useSignTypedData, useChainId} from 'wagmi'
import type {Address} from 'viem'

export type Permit2Result = {
    permit2Nonce: bigint
    permit2Deadline: bigint
    permit2Signature: `0x${string}`
}

type SignPermit2Params = {
    token: Address
    amount: bigint
    spender: Address
}
const PERMIT2_ADDRESS = '0x76E4C53Fc676A14A3F39eA38bd618eA12BB42603'
export function usePermit2Signature() {
    const {signTypedDataAsync} = useSignTypedData()
    const chainId = useChainId()

    async function signPermit2FE({
                                     token,
                                     amount,
                                     spender,
                                 }: SignPermit2Params): Promise<Permit2Result> {
        const nonce = BigInt(Math.floor(Date.now() / 1000))
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

        // EIP‑712 domain của Permit2
        const domain = {
            name: 'Permit2',
            chainId,
            verifyingContract: PERMIT2_ADDRESS,
        } as const

        // Kiểu dữ liệu theo SignatureTransfer.PermitTransferFrom
        // https://docs.uniswap.org/contracts/permit2/reference/signature-transfer
        const types = {
            TokenPermissions: [
                {name: 'token', type: 'address'},
                {name: 'amount', type: 'uint256'},
            ],
            PermitTransferFrom: [
                {name: 'permitted', type: 'TokenPermissions'},
                {name: 'spender', type: 'address'},
                {name: 'nonce', type: 'uint256'},
                {name: 'deadline', type: 'uint256'},
            ],
        } as const

        const message = {
            permitted: {
                token,
                amount,
            },
            spender,
            nonce,
            deadline,
        }

        // wagmi sẽ tự build structHash + \x19\x01 + domainSeparator
        const signature = await signTypedDataAsync({
            domain,
            types,
            primaryType: 'PermitTransferFrom',
            message,
        })

        return {
            permit2Nonce: nonce,
            permit2Deadline: deadline,
            permit2Signature: signature
        }
    }

    return {signPermit2FE}
}
