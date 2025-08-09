import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Oasis Sapphire Testnet
const sapphireTestnet = defineChain({
  id: 23295,
  name: 'Oasis Sapphire Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ROSE',
    symbol: 'ROSE',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.sapphire.oasis.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Oasis Sapphire Testnet Explorer',
      url: 'https://testnet.explorer.sapphire.oasis.dev',
    },
  },
  testnet: true,
});

const config = getDefaultConfig({
  appName: 'Oasis Wallet Connect',
  projectId: 'your_project_id_here', // Get this from WalletConnect Cloud
  chains: [sapphireTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

export default config; 