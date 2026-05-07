'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, usePublicClient } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  useDeployEscrow,
  useApproveUSDC,
  useCompleteEscrow,
  useReleaseEscrow,
} from '@/lib/hooks/useEscrow'

type Contract = {
  id: string
  amount: number
  status: string
  contract_address: string | null
  tx_hash: string | null
  created_at: string
  job_id: string
  client_id: string
  freelancer_id: string
  jobs: { title: string }
  client: { wallet_address: string }
  freelancer: { wallet_address: string }
}

export default function ContractDetailPage() {
  const { id } = useParams()
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: 80002 })
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<'client' | 'freelancer' | null>(null)
  const [txStatus, setTxStatus] = useState<string | null>(null)

  const { deployEscrow } = useDeployEscrow()
  const { approveUSDC } = useApproveUSDC()
  const { completeEscrow } = useCompleteEscrow(contract?.contract_address || '')
  const { releaseEscrow } = useReleaseEscrow(contract?.contract_address || '')

  useEffect(() => {
    if (!address) return
    fetchContract()
  }, [address, id])

  async function fetchContract() {
    const { data } = await supabase
      .from('contracts')
      .select(`
        *,
        jobs ( title ),
        client:users!contracts_client_id_fkey ( wallet_address ),
        freelancer:users!contracts_freelancer_id_fkey ( wallet_address )
      `)
      .eq('id', id)
      .single()

    if (data) {
      setContract(data as any)
      if ((data as any).client?.wallet_address?.toLowerCase() === address?.toLowerCase()) {
        setMyRole('client')
      } else if ((data as any).freelancer?.wallet_address?.toLowerCase() === address?.toLowerCase()) {
        setMyRole('freelancer')
      }
    }
    setLoading(false)
  }

  async function handleDeployAndLock() {
    if (!contract || !address) return
    setProcessing(true)
    setError(null)

    try {
      setTxStatus('Deploying contract...')
      const deployHash = await deployEscrow({
        clientAddress: contract.client.wallet_address,
        freelancerAddress: contract.freelancer.wallet_address,
        amountUSDC: contract.amount,
      })
      
      console.log('deployHash:', deployHash)

      setTxStatus('Confirming deployment...')
      const deployReceipt = await publicClient!.waitForTransactionReceipt({
        hash: deployHash as `0x${string}`
      })
      
      console.log('deployReceipt:', deployReceipt)
      console.log('contractAddress:', deployReceipt.contractAddress)

      const contractAddress = deployReceipt.contractAddress
      if (!contractAddress) throw new Error('Contract address not found')

      const { error: updateError } = await supabase
        .from('contracts')
        .update({ contract_address: contractAddress })
        .eq('id', id)
      
      console.log('updateError:', updateError)

      setTxStatus('Approving USDC...')
      const approveHash = await approveUSDC({
        spenderAddress: contractAddress,
        amountUSDC: contract.amount,
      })
      await publicClient!.waitForTransactionReceipt({ hash: approveHash as `0x${string}` })

      setTxStatus('Done!')
      await supabase
        .from('contracts')
        .update({ status: 'LOCKED', tx_hash: deployHash })
        .eq('id', id)

      await fetchContract()
    } catch (err: any) {
      console.error('에러:', err)
      setError(err.message)
    } finally {
      setProcessing(false)
      setTxStatus(null)
    }
  }

  async function handleComplete() {
    if (!contract?.contract_address) return
    setProcessing(true)
    setError(null)
    try {
      setTxStatus('Sending completion signal onchain...')
      const hash = await completeEscrow()
      await publicClient!.waitForTransactionReceipt({ hash: hash as `0x${string}` })
      await supabase.from('contracts').update({ status: 'COMPLETED' }).eq('id', id)
      await fetchContract()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
      setTxStatus(null)
    }
  }

  async function handleRelease() {
    if (!contract?.contract_address) return
    setProcessing(true)
    setError(null)
    try {
      setTxStatus('Approving & releasing onchain...')
      const hash = await releaseEscrow()
      await publicClient!.waitForTransactionReceipt({ hash: hash as `0x${string}` })
      await supabase.from('contracts').update({ status: 'RELEASED' }).eq('id', id)
      await supabase.from('jobs').update({ status: 'COMPLETED' }).eq('id', contract.job_id)
      await fetchContract()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
      setTxStatus(null)
    }
  }

  async function handleDispute() {
    setProcessing(true)
    setError(null)
    try {
      await supabase.from('contracts').update({ status: 'DISPUTED' }).eq('id', id)
      await fetchContract()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Loading...
    </div>
  )

  if (!contract) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      Contract not found
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-purple-400">CryptoGig</Link>
        <ConnectButton />
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/contracts" className="text-gray-400 hover:text-white text-sm mb-6 block">
          &larr; Back to Contracts
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{contract.jobs?.title}</h1>
            <span className="bg-blue-900 text-blue-400 text-xs px-3 py-1 rounded-full">
              {contract.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Contract Amount</p>
              <p className="text-purple-400 font-bold text-xl">{contract.amount} USDC</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">My Role</p>
              <p className="text-white font-semibold">
                {myRole === 'client' ? 'Client' : 'Freelancer'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Client</span>
              <span className="text-white font-mono text-xs">
                {contract.client?.wallet_address?.slice(0, 6)}...{contract.client?.wallet_address?.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Freelancer</span>
              <span className="text-white font-mono text-xs">
                {contract.freelancer?.wallet_address?.slice(0, 6)}...{contract.freelancer?.wallet_address?.slice(-4)}
              </span>
            </div>
            {contract.contract_address && (
              <div className="flex justify-between">
                <span className="text-gray-400">Escrow Address</span>
                <span className="text-purple-400 font-mono text-xs">
                  {contract.contract_address.slice(0, 6)}...{contract.contract_address.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Progress</h3>
          <div className="flex justify-between items-center">
            {['LOCKED', 'COMPLETED', 'RELEASED'].map((step, i) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  contract.status === step ? 'bg-purple-600 text-white' :
                  contract.status === 'RELEASED' && i < 2 ? 'bg-green-600 text-white' :
                  contract.status === 'COMPLETED' && i < 1 ? 'bg-green-600 text-white' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <span className="text-xs text-gray-400 ml-2">
                  {step === 'LOCKED' ? 'In Progress' : step === 'COMPLETED' ? 'Pending Release' : 'Paid'}
                </span>
                {i < 2 && <div className="w-16 h-px bg-gray-700 mx-3" />}
              </div>
            ))}
          </div>
        </div>

        {txStatus && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 mb-4 text-center">
            <p className="text-blue-400 text-sm">{txStatus}</p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex flex-col gap-3">
          {myRole === 'client' && contract.status === 'LOCKED' && !contract.contract_address && (
            <button
              onClick={handleDeployAndLock}
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {processing ? txStatus || 'Processing...' : 'Start Escrow (Lock USDC)'}
            </button>
          )}

          {myRole === 'freelancer' && contract.status === 'LOCKED' && contract.contract_address && (
            <button
              onClick={handleComplete}
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {processing ? txStatus || 'Processing...' : 'Mark Complete'}
            </button>
          )}

          {myRole === 'client' && contract.status === 'COMPLETED' && contract.contract_address && (
            <button
              onClick={handleRelease}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {processing ? txStatus || 'Processing...' : 'Approve & Release'}
            </button>
          )}

          {['LOCKED', 'COMPLETED'].includes(contract.status) && (
            <button
              onClick={handleDispute}
              disabled={processing}
              className="w-full bg-red-900 hover:bg-red-800 disabled:bg-gray-700 text-red-400 font-semibold py-3 rounded-lg transition-all"
            >
              {processing ? 'Processing...' : 'Raise Dispute'}
            </button>
          )}

          {contract.status === 'RELEASED' && (
            <div className="bg-green-900/30 border border-green-700 rounded-xl p-6 text-center">
              <p className="text-green-400 font-semibold text-lg">Contract Complete!</p>
              <p className="text-gray-400 text-sm mt-2">{contract.amount} USDC has been released to the freelancer</p>
            </div>
          )}

          {contract.status === 'DISPUTED' && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
              <p className="text-red-400 font-semibold text-lg">Dispute In Progress</p>
              <p className="text-gray-400 text-sm mt-2">Under admin review</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}