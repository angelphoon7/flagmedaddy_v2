import { useState } from 'react';

const TransactionViewer = ({ transactions, isVisible, onClose }) => {
  if (!isVisible || !transactions || transactions.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⛓️</span>
            <h3 className="font-semibold">Blockchain Transactions</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {transactions.map((tx, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">
                  {tx.type === 'profile' ? '👤' : '✅'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {tx.type === 'profile' ? 'Profile Creation' : 'KYC Verification'}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Hash:</span>
                      <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono break-all">
                        {tx.hash}
                      </code>
                    </div>
                    {tx.blockNumber && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Block:</span>
                        <span className="text-blue-600">#{tx.blockNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Confirmed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">ℹ️</span>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Stored on Oasis Sapphire</p>
                <p>Your data is encrypted and stored on the Oasis Sapphire blockchain, ensuring privacy and security.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionViewer; 