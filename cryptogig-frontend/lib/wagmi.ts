import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { polygon } from 'wagmi/chains'
import { defineChain } from 'viem'

export const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        `https://polygon-amoy.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
        'https://rpc-amoy.polygon.technology'
      ]
    },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' },
  },
  testnet: true,
})

export const config = getDefaultConfig({
  appName: 'CryptoGig',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo',
  chains: [polygonAmoy, polygon],
  ssr: true,
})