import { useState, useEffect, useMemo } from 'react';
import ChatBox from './ChatBox';

const InboxWidget = ({ userAddress, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [vibeRequests, setVibeRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatPartner, setActiveChatPartner] = useState(null);

  // Mock vibe requests data (in real app, this would come from blockchain/backend)
  const mockVibeRequests = useMemo(() => [
    {
      id: 1,
      from: {
        name: 'Emma Rodriguez',
        avatar: '👩‍🦰',
        address: '0x1234...5678',
        age: 28,
        bio: 'Adventure seeker and coffee enthusiast. Love hiking, photography, and trying new restaurants.'
      },
      message: "Hey! I loved your profile and thought we might have a great connection. Would you like to grab coffee sometime?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'pending',
      isRead: false
    },
    {
      id: 2,
      from: {
        name: 'Sarah Chen',
        avatar: '👩‍💼',
        address: '0x8765...4321',
        age: 26,
        bio: 'Tech professional who loves yoga, cooking, and exploring new cities. Looking for someone to share adventures with.'
      },
      message: "Hi there! Your interests really resonated with me. I'd love to chat and see if we click!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'pending',
      isRead: false
    },
    {
      id: 3,
      from: {
        name: 'Jessica Kim',
        avatar: '👩‍🎨',
        address: '0x5555...6666',
        age: 29,
        bio: 'Creative soul who finds joy in art, music, and deep conversations. Looking for genuine connections.'
      },
      message: "Your profile caught my eye! I love how authentic you seem. Would love to get to know you better!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'accepted',
      isRead: true
    }
  ], []);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setVibeRequests(mockVibeRequests);
      const unread = mockVibeRequests.filter(req => !req.isRead).length;
      setUnreadCount(unread);
      setLoading(false);
    }, 1000);
  }, [mockVibeRequests]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleVibeResponse = (requestId, response) => {
    const request = vibeRequests.find(req => req.id === requestId);
    
    if (response === 'accepted') {
      // Update status to accepted
      setVibeRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: response, isRead: true }
            : req
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Close inbox and open chat directly
      setIsOpen(false);
      setActiveChatPartner({
        name: request.from.name,
        avatar: request.from.avatar,
        address: request.from.address,
        age: request.from.age,
        bio: request.from.bio
      });
      setChatOpen(true);
    } else {
      // For declined invitations, remove them completely from the list
      setVibeRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Update unread count (if the declined request was unread)
      if (!request.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Show brief notification
      alert(`You declined ${request.from.name}'s vibe request. The invitation has been removed.`);
    }
  };

  const markAsRead = (requestId) => {
    setVibeRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, isRead: true } : req
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const openChat = (request) => {
    setIsOpen(false);
    setActiveChatPartner({
      name: request.from.name,
      avatar: request.from.avatar,
      address: request.from.address,
      age: request.from.age,
      bio: request.from.bio
    });
    setChatOpen(true);
  };

  // Inbox Toggle Button (always visible)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="text-2xl">💌</div>
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount}
            </div>
          )}
        </button>
      </div>
    );
  }

  // Full Inbox Modal
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">💌</div>
              <div>
                <h2 className="text-2xl font-bold">Vibe Inbox</h2>
                <p className="text-pink-100">
                  {vibeRequests.filter(req => req.status === 'pending').length} pending invitations
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              <span className="ml-3 text-gray-600">Loading vibes...</span>
            </div>
          ) : vibeRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">You&apos;ve processed all your vibe invitations. New ones will appear here when they arrive!</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>💡 Accepted vibes become active chats</p>
                <p>🗑️ Declined vibes are automatically removed</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {vibeRequests.map((request) => (
                <div
                  key={request.id}
                  className={`p-6 hover:bg-gray-50 transition-all duration-300 ${
                    !request.isRead ? 'bg-pink-50 border-l-4 border-l-pink-500' : ''
                  }`}
                  onClick={() => markAsRead(request.id)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {request.from.avatar}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-800">{request.from.name}</h3>
                          <span className="text-sm text-gray-500">• {request.from.age}</span>
                          {!request.isRead && (
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatTimeAgo(request.timestamp)}</span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.from.bio}</p>
                      
                      <div className="bg-gray-100 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700 italic">&ldquo;{request.message}&rdquo;</p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                              ⏳ Pending
                            </span>
                          )}
                          {request.status === 'accepted' && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              ✅ Accepted
                            </span>
                          )}
                          {request.status === 'rejected' && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                              ❌ Declined
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVibeResponse(request.id, 'rejected');
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
                            >
                              👎 Decline
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVibeResponse(request.id, 'accepted');
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
                            >
                              💚 Accept
                            </button>
                          </div>
                        )}
                        
                        {request.status === 'accepted' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openChat(request);
                            }}
                            className="bg-pink-500 hover:bg-pink-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
                          >
                            💬 Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-sm text-gray-600">
            💡 Tip: Accept vibes to start chatting and building connections!
          </p>
        </div>
      </div>

      {/* Chat Box */}
      <ChatBox
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        chatPartner={activeChatPartner}
        userAddress={userAddress}
      />
    </div>
  );
};

export default InboxWidget; 