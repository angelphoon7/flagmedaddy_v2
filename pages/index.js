import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useDisconnect } from 'wagmi';
import { AppProvider, useApp } from '../contexts/AppContext';
import ErrorBoundary from '../components/ErrorBoundary';
import ConnectWallet from '../components/ConnectWallet';
import KYCProfileUpload from '../components/KYCProfileUpload';
import InboxWidget from '../components/InboxWidget';
import TransactionViewer from '../components/TransactionViewer';

// Mock user data for display
const mockUsers = [
  {
    id: 1,
    name: "Emma Rodriguez",
    gender: "Female",
    ageGroup: "25-30",
    age: 27,
    bio: "Adventure seeker who loves hiking, coffee, and deep conversations under the stars. Looking for someone genuine.",
    interests: ["Travel", "Photography", "Coffee"],
    avatar: "E"
  },
  {
    id: 2,
    name: "Marcus Johnson",
    gender: "Male", 
    ageGroup: "28-35",
    age: 31,
    bio: "Tech entrepreneur by day, chef by night. I believe the best relationships start with great food and laughter.",
    interests: ["Cooking", "Tech", "Fitness"],
    avatar: "M"
  },
  {
    id: 3,
    name: "Sophia Chen",
    gender: "Female",
    ageGroup: "22-28",
    age: 24,
    bio: "Artist and yoga instructor seeking someone who appreciates creativity and mindfulness. Let's create something beautiful together.",
    interests: ["Art", "Yoga", "Music"],
    avatar: "S"
  },
  {
    id: 4,
    name: "Alex Thompson",
    gender: "Non-binary",
    ageGroup: "26-32",
    age: 29,
    bio: "Book lover and world traveler. I collect stories from every place I visit. What's your favorite chapter?",
    interests: ["Reading", "Travel", "Writing"],
    avatar: "A"
  },
  {
    id: 5,
    name: "Isabella Martinez",
    gender: "Female",
    ageGroup: "23-29",
    age: 26,
    bio: "Dance teacher with a passion for salsa and bachata. Life's too short not to dance through it!",
    interests: ["Dancing", "Music", "Teaching"],
    avatar: "I"
  },
  {
    id: 6,
    name: "David Kim",
    gender: "Male",
    ageGroup: "30-36",
    age: 33,
    bio: "Software engineer who codes by day and plays guitar by night. Looking for my duet partner in life.",
    interests: ["Music", "Technology", "Gaming"],
    avatar: "D"
  },
  {
    id: 7,
    name: "Luna Patel",
    gender: "Female",
    ageGroup: "24-30",
    age: 27,
    bio: "Veterinarian who believes every creature deserves love. I'm passionate about animal rescue and sustainable living.",
    interests: ["Animals", "Environment", "Volunteering"],
    avatar: "L"
  },
  {
    id: 8,
    name: "Jordan Williams",
    gender: "Male",
    ageGroup: "27-33",
    age: 30,
    bio: "Personal trainer and nutrition coach. I believe in living life to the fullest - mind, body, and soul.",
    interests: ["Fitness", "Nutrition", "Outdoors"],
    avatar: "J"
  },
  {
    id: 9,
    name: "Zoe Anderson",
    gender: "Female",
    ageGroup: "21-27",
    age: 25,
    bio: "Marine biologist exploring the depths of the ocean and life. Seeking someone who shares my curiosity about the world.",
    interests: ["Science", "Ocean", "Research"],
    avatar: "Z"
  },
  {
    id: 10,
    name: "Riley Cooper",
    gender: "Non-binary",
    ageGroup: "25-31",
    age: 28,
    bio: "Graphic designer and coffee connoisseur. I create visual stories and am looking for someone to share new adventures with.",
    interests: ["Design", "Coffee", "Art"],
    avatar: "R"
  },
  {
    id: 11,
    name: "Maya Singh",
    gender: "Female",
    ageGroup: "26-32",
    age: 29,
    bio: "Psychology PhD student fascinated by human connections. Let's explore the depths of meaningful conversation together.",
    interests: ["Psychology", "Books", "Meditation"],
    avatar: "M"
  },
  {
    id: 12,
    name: "Ethan Brooks",
    gender: "Male",
    ageGroup: "29-35",
    age: 32,
    bio: "Architect who designs spaces for people to connect. Looking for someone to build a beautiful life together.",
    interests: ["Architecture", "Design", "Travel"],
    avatar: "E"
  }
];

const WalletApp = () => {
  const { address, isConnected: wagmiConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { userProfile, isProfileComplete, createProfile, loading, error } = useApp();
  const router = useRouter();
  
  // Use RainbowKit connection state
  const isConnected = wagmiConnected;
  const userAddress = address;
  
  // Check if user has completed registration
  const hasUserProfile = userProfile && isProfileComplete;

  // Auto-check if connected wallet is registered
  useEffect(() => {
    const checkRegistration = async () => {
      if (isConnected && userAddress && !userProfile) {
        try {
          console.log('🔍 Checking if wallet is registered:', userAddress);
          const response = await fetch(`http://localhost:3001/api/user/${userAddress}/status`);
          const data = await response.json();
          
          if (data.success && data.data.isRegistered) {
            console.log('✅ Wallet is registered! Auto-logging in...');
            // Create profile object from API response
            const profileData = {
              name: data.data.username,
              username: data.data.username,
              age: data.data.age,
              gender: data.data.gender,
              isKYCVerified: data.data.isKYCVerified,
              isActive: data.data.isActive,
              createdAt: data.data.createdAt,
              walletAddress: data.data.walletAddress
            };
            
            // Set profile to trigger main app view
            createProfile(profileData);

            // Persist flag and redirect to Vibe-or-Nah page
            try { if (typeof window !== 'undefined') window.localStorage.setItem('fmd_registered', '1'); } catch {}
            router.replace('/home');
            return;
          } else {
            console.log('👤 Wallet not registered - will show KYC form');
          }
        } catch (error) {
          console.error('❌ Error checking wallet registration:', error);
        }
      }
    };

    checkRegistration();
  }, [isConnected, userAddress, userProfile, createProfile, router]);

  // If we already have a profile in app state, or we persisted a registered flag, skip straight to /home
  useEffect(() => {
    const hasFlag = typeof window !== 'undefined' && window.localStorage.getItem('fmd_registered') === '1';
    if (isConnected && (hasUserProfile || hasFlag)) {
      router.replace('/home');
    }
  }, [isConnected, hasUserProfile, router]);

  // State for managing visible profiles
  const [visibleProfiles, setVisibleProfiles] = useState(mockUsers);
  const [sentVibes, setSentVibes] = useState(new Set()); // Track sent vibes
  const [showTransactions, setShowTransactions] = useState(false);
  
  // Mock transaction data (would be real in production)
  const mockTransactions = [
    {
      type: 'profile',
      hash: '0x1234567890abcdef1234567890abcdef12345678',
      blockNumber: 123456,
      timestamp: Date.now() - 3600000 // 1 hour ago
    },
    {
      type: 'kyc',
      hash: '0xabcdef1234567890abcdef1234567890abcdef12',
      blockNumber: 123457,
      timestamp: Date.now() - 3500000 // 55 minutes ago
    }
  ];

  // Handle vibe button click - send invitation
  const handleVibeClick = (targetUser) => {
    // Add to sent vibes set
    setSentVibes(prev => new Set([...prev, targetUser.id]));
    
    // In real app, this would send vibe request to blockchain/backend
    // For now, simulate sending the invitation
    console.log('Vibe sent to:', targetUser);
    
    // Show success message
    alert(`💕 Vibe sent to ${targetUser.name}! They'll receive your invitation in their inbox.`);
    
    // Optional: Remove from visible profiles after sending vibe
    // setVisibleProfiles(prev => prev.filter(user => user.id !== targetUser.id));
  };

  // Handle nah button click - remove from suggestions
  const handleNahClick = (targetUser) => {
    // Remove the profile from visible suggestions
    setVisibleProfiles(prev => prev.filter(user => user.id !== targetUser.id));
    
    console.log('Nah to:', targetUser);
    
    // Show brief feedback
    // alert(`👎 ${targetUser.name} removed from your suggestions.`);
  };

  // If not connected, show wallet connection screen
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-rose-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
          </div>
          
          <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-200">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-4xl mr-3">💕</div>
                  <h2 className="text-2xl font-bold text-pink-600">Flag Me Daddy</h2>
                </div>
                <p className="text-gray-600">Dating App on Oasis Sapphire</p>
                <div className="flex justify-center space-x-2 mt-4">
                  <span className="text-2xl">🚩</span>
                  <span className="text-2xl">❤️</span>
                  <span className="text-2xl">🚩</span>
                </div>
              </div>
              
              {/* Connect Wallet Button */}
              <div className="text-center">
                <div className="mb-4">
                  <ConnectWallet />
                </div>
                
                <p className="text-xs text-gray-500">
                  Connect your wallet to start exploring profiles
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Connection Failed</span>
                </div>
                <p className="mt-1 text-sm">{error}</p>
                <p className="mt-2 text-sm">
                  💡 Try refreshing the page or check your MetaMask extension
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If connected but no profile, show registration/profile upload
  if (isConnected && !hasUserProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">👋 Welcome to Flag Me Daddy!</h1>
            <p className="text-lg text-gray-600">Let's create your dating profile</p>
            <p className="text-sm text-gray-500 mt-2">Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white text-center">
                <div className="text-4xl mb-2">💕</div>
                <h2 className="text-2xl font-bold mb-1">Welcome to Flag Me Daddy!</h2>
                <p className="text-pink-100">Create your dating profile on the blockchain</p>
                <div className="flex justify-center space-x-3 mt-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">🚩 Red Flags</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">💚 Green Flags</span>
                </div>
              </div>
              <div className="p-8">
                <KYCProfileUpload 
                  onComplete={createProfile}
                  userAddress={userAddress}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile complete - show user profiles
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl mr-3">💕</div>
            <h1 className="text-4xl font-bold text-pink-600">Flag Me Daddy</h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">Discover Amazing People</p>
          <p className="text-sm text-gray-500">Swipe through profiles and find your perfect match</p>
          
                     {/* User Status Bar */}
           <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 inline-flex items-center space-x-4 shadow-lg">
             <div className="flex items-center space-x-2">
               <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                 {userProfile?.name?.charAt(0)?.toUpperCase() || '👤'}
               </div>
               <span className="font-medium text-gray-800">{userProfile?.name || 'User'}</span>
             </div>
             <span className="text-gray-300">•</span>
                         <span className="text-sm text-gray-600">
              Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
            </span>
            <button
              onClick={() => setShowTransactions(true)}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-1 rounded-full transition-colors flex items-center space-x-1"
            >
              <span>⛓️</span>
              <span>Transactions</span>
            </button>
            <button
              onClick={() => disconnect()}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-full transition-colors"
            >
              Disconnect
            </button>
           </div>
        </div>

        {/* User Profiles Grid */}
        {visibleProfiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">All Caught Up!</h2>
            <p className="text-lg text-gray-600 mb-6">You've seen all available profiles in your area.</p>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <div className="space-y-3 text-gray-600">
                <p className="flex items-center justify-center space-x-2">
                  <span>💕</span>
                  <span>Check your inbox for new vibe responses</span>
                </p>
                <p className="flex items-center justify-center space-x-2">
                  <span>🔄</span>
                  <span>New profiles will appear as people join</span>
                </p>
                <p className="flex items-center justify-center space-x-2">
                  <span>🌟</span>
                  <span>Share Flag Me Daddy with friends!</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProfiles.map((user) => (
            <div key={user.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              {/* Profile Header */}
              <div className="relative">
                <div className="bg-gradient-to-br from-pink-400 to-purple-500 h-32 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {user.avatar}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Verified
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{user.name}</h3>
                  <div className="flex items-center justify-center space-x-3 text-sm text-gray-600 mb-3">
                    <span className="flex items-center space-x-1">
                      <span className="text-pink-500">⚧</span>
                      <span>{user.gender}</span>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center space-x-1">
                      <span className="text-blue-500">🎂</span>
                      <span>{user.ageGroup}</span>
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    "{user.bio}"
                  </p>
                </div>

                {/* Interests */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, index) => (
                      <span key={index} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {sentVibes.has(user.id) ? (
                    <button 
                      disabled
                      className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      ✅ Vibe Sent
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleVibeClick(user)}
                      className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      👍 Vibe
                    </button>
                  )}
                  <button 
                    onClick={() => handleNahClick(user)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium transform hover:scale-105 active:scale-95"
                  >
                    👎 Nah
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Bottom Info */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="text-3xl mb-4">👎👍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Dating System</h3>
            <p className="text-gray-600 mb-4">
              Swipe through profiles and make your choice! 
              Connect with people you like and start meaningful conversations.
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-1">👍</div>
                <div className="font-medium text-green-600">Vibe</div>
                <div className="text-gray-500">We could vibe!</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">👎</div>
                <div className="font-medium text-red-600">Nah</div>
                <div className="text-gray-500">Not feeling it</div>
              </div>
            </div>
          </div>
        </div>

        {/* Inbox Widget - Fixed Position */}
        <InboxWidget userAddress={userAddress} />
        
        {/* Transaction Viewer Modal */}
        <TransactionViewer 
          transactions={mockTransactions}
          isVisible={showTransactions}
          onClose={() => setShowTransactions(false)}
        />
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <WalletApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
