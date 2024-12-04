// Import viem transport, viem chain, and ENSjs
import { http } from 'viem'
import { mainnet } from 'viem/chains'
import { createEnsPublicClient } from '@ensdomains/ensjs'

// Create the client
const client = createEnsPublicClient({
  chain: mainnet,
  transport: http('http://localhost:8545'),
})

// Use the client
const ethAddress = await client.getAddressRecord({ name: 'w.eth' })

// Add console.log to display the ethAddress
console.log('Ethereum address for ens.eth:', ethAddress)
