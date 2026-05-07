import { useWriteContract, useReadContract, useDeployContract } from 'wagmi'
import { parseUnits } from 'viem'
import { ESCROW_ABI } from '@/lib/escrowABI'
import { ESCROW_BYTECODE } from '@/lib/escrowBytecode'
import { USDC_ADDRESS, PLATFORM_ADDRESS, PLATFORM_FEE_PCT } from '@/lib/constants'

const ERC20_ABI = [
  {
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Escrow 컨트랙트 배포
export function useDeployEscrow() {
  const { deployContractAsync, isPending } = useDeployContract()

  async function deployEscrow({
    clientAddress,
    freelancerAddress,
    amountUSDC,
  }: {
    clientAddress: string
    freelancerAddress: string
    amountUSDC: number
  }) {
    const amount = parseUnits(amountUSDC.toString(), 6)

    const hash = await deployContractAsync({
      abi: ESCROW_ABI,
      bytecode: ESCROW_BYTECODE,
      args: [
        clientAddress as `0x${string}`,
        freelancerAddress as `0x${string}`,
        PLATFORM_ADDRESS as `0x${string}`,
        USDC_ADDRESS as `0x${string}`,
        amount,
        PLATFORM_FEE_PCT,
      ],
    })

    return hash
  }

  return { deployEscrow, isPending }
}

// USDC approve
export function useApproveUSDC() {
  const { writeContractAsync, isPending } = useWriteContract()

  async function approveUSDC({
    spenderAddress,
    amountUSDC,
  }: {
    spenderAddress: string
    amountUSDC: number
  }) {
    const amount = parseUnits(amountUSDC.toString(), 6)

    const hash = await writeContractAsync({
      address: USDC_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress as `0x${string}`, amount],
    })

    return hash
  }

  return { approveUSDC, isPending }
}

// Escrow lock
export function useLockEscrow(contractAddress: string) {
  const { writeContractAsync, isPending } = useWriteContract()

  async function lockEscrow() {
    const hash = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'lock',
    })
    return hash
  }

  return { lockEscrow, isPending }
}

// Escrow complete
export function useCompleteEscrow(contractAddress: string) {
  const { writeContractAsync, isPending } = useWriteContract()

  async function completeEscrow() {
    const hash = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'complete',
    })
    return hash
  }

  return { completeEscrow, isPending }
}

// Escrow release
export function useReleaseEscrow(contractAddress: string) {
  const { writeContractAsync, isPending } = useWriteContract()

  async function releaseEscrow() {
    const hash = await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'release',
    })
    return hash
  }

  return { releaseEscrow, isPending }
}

// Escrow 상태 조회
export function useEscrowStatus(contractAddress: string) {
  const { data: status } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'getStatus',
  })

  return { status }
}