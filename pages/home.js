import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { AppProvider, useApp } from '../contexts/AppContext';
import ErrorBoundary from '../components/ErrorBoundary';
import InboxWidget from '../components/InboxWidget';
import TransactionViewer from '../components/TransactionViewer';

// Mock user data (same set as index.js)
const mockUsers = [
  { id: 1, name: 'Emma Rodriguez', gender: 'Female', ageGroup: '25-30', age: 27, bio: 'Adventure seeker who loves hiking, coffee, and deep conversations under the stars. Looking for someone genuine.', interests: ['Travel', 'Photography', 'Coffee'], avatar: 'E' },
  { id: 2, name: 'Marcus Johnson', gender: 'Male', ageGroup: '28-35', age: 31, bio: 'Tech entrepreneur by day, chef by night. I believe the best relationships start with great food and laughter.', interests: ['Cooking', 'Tech', 'Fitness'], avatar: 'M' },
  { id: 3, name: 'Sophia Chen', gender: 'Female', ageGroup: '22-28', age: 24, bio: 'Artist and yoga instructor seeking someone who appreciates creativity and mindfulness. Let\'s create something beautiful together.', interests: ['Art', 'Yoga', 'Music'], avatar: 'S' },
  { id: 4, name: 'Alex Thompson', gender: 'Non-binary', ageGroup: '26-32', age: 29, bio: 'Book lover and world traveler. I collect stories from every place I visit. What\'s your favorite chapter?', interests: ['Reading', 'Travel', 'Writing'], avatar: 'A' },
  { id: 5, name: 'Isabella Martinez', gender: 'Female', ageGroup: '23-29', age: 26, bio: "Dance teacher with a passion for salsa and bachata. Life's too short not to dance through it!", interests: ['Dancing', 'Music', 'Teaching'], avatar: 'I' },
  { id: 6, name: 'David Kim', gender: 'Male', ageGroup: '30-36', age: 33, bio: 'Software engineer who codes by day and plays guitar by night. Looking for my duet partner in life.', interests: ['Music', 'Technology', 'Gaming'], avatar: 'D' },
  { id: 7, name: 'Luna Patel', gender: 'Female', ageGroup: '24-30', age: 27, bio: 'Veterinarian who believes every creature deserves love. I\'m passionate about animal rescue and sustainable living.', interests: ['Animals', 'Environment', 'Volunteering'], avatar: 'L' },
  { id: 8, name: 'Jordan Williams', gender: 'Male', ageGroup: '27-33', age: 30, bio: 'Personal trainer and nutrition coach. I believe in living life to the fullest - mind, body, and soul.', interests: ['Fitness', 'Nutrition', 'Outdoors'], avatar: 'J' },
  { id: 9, name: 'Zoe Anderson', gender: 'Female', ageGroup: '21-27', age: 25, bio: 'Marine biologist exploring the depths of the ocean and life. Seeking someone who shares my curiosity about the world.', interests: ['Science', 'Ocean', 'Research'], avatar: 'Z' },
  { id: 10, name: 'Riley Cooper', gender: 'Non-binary', ageGroup: '25-31', age: 28, bio: 'Graphic designer and coffee connoisseur. I create visual stories and am looking for someone to share new adventures with.', interests: ['Design', 'Coffee', 'Art'], avatar: 'R' },
  { id: 11, name: 'Maya Singh', gender: 'Female', ageGroup: '26-32', age: 29, bio: 'Psychology PhD student fascinated by human connections. Let\'s explore the depths of meaningful conversation together.', interests: ['Psychology', 'Books', 'Meditation'], avatar: 'M' },
  { id: 12, name: 'Ethan Brooks', gender: 'Male', ageGroup: '29-35', age: 32, bio: 'Architect who designs spaces for people to connect. Looking for someone to build a beautiful life together.', interests: ['Architecture', 'Design', 'Travel'], avatar: 'E' },
];

function VibeOrNahView() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { userProfile } = useApp();

  const userAddress = address;
  const [visibleProfiles, setVisibleProfiles] = useState(mockUsers);
  const [sentVibes, setSentVibes] = useState(new Set());
  const [showTransactions, setShowTransactions] = useState(false);

  const mockTransactions = [
    { type: 'profile', hash: '0x1234567890abcdef1234567890abcdef12345678', blockNumber: 123456, timestamp: Date.now() - 3600000 },
    { type: 'kyc', hash: '0xabcdef1234567890abcdef1234567890abcdef12', blockNumber: 123457, timestamp: Date.now() - 3500000 },
  ];

  const handleVibeClick = (targetUser) => {
    setSentVibes((prev) => new Set([...prev, targetUser.id]));
    alert(`💕 Vibe sent to ${targetUser.name}! They'll receive your invitation in their inbox.`);
  };

  const handleNahClick = (targetUser) => {
    setVisibleProfiles((prev) => prev.filter((user) => user.id !== targetUser.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl mr-3">💕</div>
            <h1 className="text-4xl font-bold text-pink-600">Flag Me Daddy</h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">Discover Amazing People</p>
          <p className="text-sm text-gray-500">Swipe through profiles and find your perfect match</p>

          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 inline-flex items-center space-x-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {userProfile?.name?.charAt(0)?.toUpperCase() || '👤'}
              </div>
              <span className="font-medium text-gray-800">{userProfile?.name || 'User'}</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600">Connected: {isConnected ? `${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)}` : 'Not connected'}</span>
            {isConnected && (
              <>
                <button onClick={() => setShowTransactions(true)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-1 rounded-full transition-colors flex items-center space-x-1">
                  <span>⛓️</span>
                  <span>Transactions</span>
                </button>
                <button onClick={() => disconnect()} className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-full transition-colors">
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {visibleProfiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">All Caught Up!</h2>
            <p className="text-lg text-gray-600 mb-6">You&apos;ve seen all available profiles in your area.</p>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <div className="space-y-3 text-gray-600">
                <p className="flex items-center justify-center space-x-2"><span>💕</span><span>Check your inbox for new vibe responses</span></p>
                <p className="flex items-center justify-center space-x-2"><span>🔄</span><span>New profiles will appear as people join</span></p>
                <p className="flex items-center justify-center space-x-2"><span>🌟</span><span>Share Flag Me Daddy with friends!</span></p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProfiles.map((user) => (
              <div key={user.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="relative">
                  <div className="bg-gradient-to-br from-pink-400 to-purple-500 h-32 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">{user.avatar}</div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">✓ Verified</div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{user.name}</h3>
                    <div className="flex items-center justify-center space-x-3 text-sm text-gray-600 mb-3">
                      <span className="flex items-center space-x-1"><span className="text-pink-500">⚧</span><span>{user.gender}</span></span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center space-x-1"><span className="text-blue-500">🎂</span><span>{user.ageGroup}</span></span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;{user.bio}&rdquo;</p>
                  </div>
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest, index) => (
                        <span key={index} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-medium">{interest}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {sentVibes.has(user.id) ? (
                      <button disabled className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed">✅ Vibe Sent</button>
                    ) : (
                      <button onClick={() => handleVibeClick(user)} className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-200">👍 Vibe</button>
                    )}
                    <button onClick={() => handleNahClick(user)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium transform hover:scale-105 active:scale-95">👎 Nah</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="text-3xl mb-4">👎👍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Dating System</h3>
            <p className="text-gray-600 mb-4">Swipe through profiles and make your choice! Connect with people you like and start meaningful conversations.</p>
            <div className="flex justify-center space-x-6 text-sm">
              <div className="text-center"><div className="text-2xl mb-1">👍</div><div className="font-medium text-green-600">Vibe</div><div className="text-gray-500">We could vibe!</div></div>
              <div className="text-center"><div className="text-2xl mb-1">👎</div><div className="font-medium text-red-600">Nah</div><div className="text-gray-500">Not feeling it</div></div>
            </div>
          </div>
        </div>

        <InboxWidget userAddress={userAddress} />
        <TransactionViewer transactions={mockTransactions} isVisible={showTransactions} onClose={() => setShowTransactions(false)} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <VibeOrNahView />
      </AppProvider>
    </ErrorBoundary>
  );
}

