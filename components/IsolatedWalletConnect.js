import { useState } from 'react';
import oasisService from '../utils/oasis';

const IsolatedWalletConnect = ({ onConnect, onError }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConnectClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmConnect = async () => {
    setShowConfirmation(false);
    setIsConnecting(true);
    
    try {
      // Use the Oasis service to connect wallet
      const address = await oasisService.connectWallet();
      
      // Check if MetaMask is being used
      if (window.ethereum && !window.ethereum.isMetaMask) {
        throw new Error('Please use MetaMask wallet. Other wallets are not supported.');
      }
      
      console.log('Connected to MetaMask:', address);
      onConnect(address);
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      
      // Handle specific error types
      if (error.code === 4001) {
        onError('Connection was rejected. Please approve the connection in MetaMask.');
      } else if (error.message.includes('MetaMask not found') || error.message.includes('No wallet extension found')) {
        onError('MetaMask not found. Please install MetaMask extension.');
      } else if (error.message.includes('use MetaMask wallet')) {
        onError('Please use MetaMask wallet. Other wallets are not supported.');
      } else {
        onError(`Connection failed: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCancelConnect = () => {
    setShowConfirmation(false);
  };



  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-4xl mb-4">🦊</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">Connect MetaMask</h3>
      <p className="text-gray-600 mb-6">Connect your MetaMask wallet to start dating on FlagMeDaddy</p>
      <button
        onClick={handleConnectClick}
        disabled={isConnecting}
        className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
      </button>
      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <p>💡 Make sure you have MetaMask extension installed</p>
        <div className="text-xs">
          <p>Don&apos;t have MetaMask? Install:</p>
          <p>• <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">MetaMask</a></p>
        </div>
      </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-3xl mb-4">🦊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect MetaMask</h3>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  🦊 MetaMask Required
                </p>
              </div>
              
              <p className="text-gray-600 mb-6">
                This will request permission to connect your MetaMask wallet to FlagMeDaddy. 
                You&apos;ll need to approve this connection in MetaMask.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelConnect}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmConnect}
                  disabled={isConnecting}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IsolatedWalletConnect; 