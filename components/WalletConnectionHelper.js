import { useState } from 'react';
import oasisService from '../utils/oasis';

const WalletConnectionHelper = ({ onSuccess, onError }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      console.log('Connecting wallet for flag system...');
      const address = await oasisService.connectWallet();
      console.log('Wallet connected:', address);
      onSuccess?.(address);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      onError?.(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      <span className="text-xs text-gray-500">Required for flag system</span>
    </div>
  );
};

export default WalletConnectionHelper;
