import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const Navigation = ({ activeTab, onTabChange }) => {
  const { userProfile, isVerified, disconnectWallet, userAddress } = useApp();
  const [showProfile, setShowProfile] = useState(false);

  const tabs = [
    { id: 'matches', label: 'Matches', icon: '💕' },
    { id: 'flags', label: 'Flags', icon: '🚩' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <div className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">💘</div>
            <h1 className="text-xl font-bold text-gray-800">FlagMeDaddy</h1>
            <span className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded-full">
              Sapphire
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {userProfile && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Welcome, {userProfile.name}!</span>
                {isVerified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}

              </div>
            )}
            
            <button
              onClick={disconnectWallet}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Navigation; 