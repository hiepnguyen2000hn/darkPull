// usePermit2Signature.ts
import {useSignTypedData} from 'wagmi'
import type {Address} from 'viem'


type SignPermit2Params = {
    token: Address
    amount: bigint
    spender: Address
    chainId: number
}
const PERMIT2_ADDRESS = '0x76E4C53Fc676A14A3F39eA38bd618eA12BB42603'
export function usePermit2Signature() {
    const {signTypedDataAsync} = useSignTypedData()

    async function signPermit2FE({
                                     token,
                                     amount,
                                     spender,
                                     chainId,
                                 }: SignPermit2Params): Promise<`0x${string}`> {
        const nonce = Math.floor(Date.now() / 1000)
        const deadline = Math.floor(Date.now() / 1000) + 3600

        // EIP‑712 domain của Permit2
        const domain = {
            name: 'Permit2',
            version: '1',
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

        return signature
    }

    return {signPermit2FE}
}
