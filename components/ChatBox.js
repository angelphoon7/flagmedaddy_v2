import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import FlagSubmission from './FlagSubmission';
import WalletConnectionHelper from './WalletConnectionHelper';
import oasisService from '../utils/oasis';
import {ethers} from 'ethers';

const ChatBox = ({ isOpen, onClose, chatPartner, userAddress }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPartnerFlags, setShowPartnerFlags] = useState(false);
  const [showFlagSubmission, setShowFlagSubmission] = useState(false);
  const [partnerFlags, setPartnerFlags] = useState({ redFlags: [], greenFlags: [] });
  const [partnerRating, setPartnerRating] = useState(null);
  const [isLoadingFlags, setIsLoadingFlags] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const messagesEndRef = useRef(null);

  // Mock conversation data
  const mockMessages = useMemo(() => [
    {
      id: 1,
      content: `Hi ${chatPartner?.name || 'Emma'}! I loved your profile and thought we might have a great connection. Would you like to grab coffee sometime?`,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isOwn: true,
      senderName: chatPartner?.name || 'Emma',
    },
    {
      id: 2,
      content: "Hi! Thanks for reaching out! I'd love to grab coffee. Your profile caught my eye too. When are you free?",
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      isOwn: false,
      senderName: chatPartner?.name || 'Emma',
    },
    {
      id: 3,
      content: "Great! I'm free this weekend. How about Saturday at 2 PM? There's a nice café downtown I know.",
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      isOwn: true,
      senderName: chatPartner?.name || 'Emma',
    },
    {
      id: 4,
      content: "Saturday at 2 PM sounds perfect! I'll send you the address. Looking forward to meeting you! 😊",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      isOwn: false,
      senderName: chatPartner?.name || 'Emma',
    }
  ], [chatPartner?.name]);

  useEffect(() => {
    if (isOpen && chatPartner) {
      // Load conversation history
      setMessages(mockMessages);
      // Check if wallet is already connected
      checkWalletConnection();
    }
  }, [isOpen, chatPartner, checkWalletConnection, mockMessages]);

  const checkWalletConnection = useCallback(async () => {
    try {
      // Check if wallet is connected in browser
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0 && !oasisService.isContractInitialized()) {
            await oasisService.connectWallet();
          }
        } catch (error) {
          // Ignore account check errors
        }
      }
      
      if (oasisService.isContractInitialized()) {
        setWalletConnected(true);
        loadPartnerData();
      } else {
        setWalletConnected(false);
      }
    } catch (error) {
      setWalletConnected(false);
    }
  }, [loadPartnerData]);

  const handleWalletConnected = async (address) => {
    setWalletConnected(true);
    setConnectionError(null);
    // Load partner data now that wallet is connected
    await loadPartnerData();
  };

  const handleWalletError = (error) => {
    setConnectionError(error);
    setWalletConnected(false);
  };

  // Load partner's flags and rating from blockchain
  const loadPartnerData = useCallback(async () => {
    if (!chatPartner?.address) return;
    
    // Only load data if wallet is connected
    if (!walletConnected || !oasisService.isContractInitialized()) {
      return;
    }
    
    setIsLoadingFlags(true);
    try {
      
      // Load flags
      const redFlags = await oasisService.getVisibleRedFlags(chatPartner.address);
      const greenFlags = await oasisService.getVisibleGreenFlags(chatPartner.address);
      
      // Format flags for display
      const formattedRedFlags = redFlags.map((flag, index) => ({
        id: `red_${index}`,
        comment: flag.review || '(Encrypted review)',
        reviewer: flag.from === '0x0000000000000000000000000000000000000000' ? 'Anonymous' : 'Verified User',
        date: formatFlagDate(flag.timestamp),
        category: flag.category,
        severity: flag.severity,
        isEncrypted: flag.isEncrypted
      }));

      const formattedGreenFlags = greenFlags.map((flag, index) => ({
        id: `green_${index}`,
        comment: flag.review || '(Encrypted review)',
        reviewer: flag.from === '0x0000000000000000000000000000000000000000' ? 'Anonymous' : 'Verified User',
        date: formatFlagDate(flag.timestamp),
        category: flag.category,
        isEncrypted: flag.isEncrypted
      }));

      setPartnerFlags({
        redFlags: formattedRedFlags,
        greenFlags: formattedGreenFlags
      });

      // Load user rating
      const rating = await oasisService.getUserRating(chatPartner.address);
      setPartnerRating(rating);

    } catch (error) {
      // Fallback to mock data
      setPartnerFlags({
        redFlags: [
          { id: 1, comment: "Always on phone during dates", reviewer: "Anonymous", date: "2 weeks ago", category: "behavior", severity: 6 },
          { id: 2, comment: "Talks only about themselves", reviewer: "Anonymous", date: "1 month ago", category: "communication", severity: 5 },
        ],
        greenFlags: [
          { id: 3, comment: "Great listener and very kind", reviewer: "Anonymous", date: "3 weeks ago", category: "kindness" },
          { id: 4, comment: "Pays for coffee, true gentleman", reviewer: "Anonymous", date: "2 weeks ago", category: "behavior" },
        ]
      });
      setPartnerRating(7.5);
    } finally {
      setIsLoadingFlags(false);
    }
  }, [chatPartner?.address, walletConnected]);

  const formatFlagDate = (timestamp) => {
    const flagDate = new Date(timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now - flagDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: userAddress,
      senderName: 'You',
      content: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate partner typing and response
    setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "That's awesome! Tell me more 😄",
        "I totally agree! 💯",
        "Haha, you're funny! 😂",
        "That sounds amazing! I'd love to try that too 🌟",
        "You have such great taste! 👌",
        "I'm really enjoying our conversation! 💕"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const partnerMessage = {
        id: messages.length + 2,
        sender: chatPartner?.address || '0x1234...5678',
        senderName: chatPartner?.name || 'Emma',
        content: randomResponse,
        timestamp: new Date(),
        isOwn: false
      };

      setMessages(prev => [...prev, partnerMessage]);
    }, 3000);
  };

  const handleFlagSubmission = async (flagData) => {
    // Check if wallet is connected
    if (!walletConnected || !oasisService.isContractInitialized()) {
      // Try to reconnect if wallet is available
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await oasisService.connectWallet();
            if (oasisService.isContractInitialized()) {
              setWalletConnected(true);
              // Continue with flag submission
            } else {
              alert('Failed to initialize contract. Please try connecting your wallet again.');
              return;
            }
          } else {
            alert('Please connect your wallet first to submit flags.');
            return;
          }
        } catch (error) {
          alert('Please connect your wallet first to submit flags.');
          return;
        }
      } else {
        alert('Please connect your wallet first to submit flags.');
        return;
      }
    }
    
    try {
      
      let result;
      const { isRedFlag, review, category, severity, isAnonymous, isEncrypted } = flagData;
      
      if (isEncrypted) {
        // Submit encrypted flag
        const encryptedReview = await oasisService.encryptReviewForSubmission(review);
        result = await oasisService.submitEncryptedFlagEnhanced(
          chatPartner.address,
          isRedFlag,
          encryptedReview,
          category,
          severity
        );
      } else if (isAnonymous) {
        // Submit anonymous flag
        result = await oasisService.submitAnonymousFlagEnhanced(
          chatPartner.address,
          isRedFlag,
          review,
          category,
          severity
        );
      } else {
        // Submit regular flag
        result = await oasisService.submitFlagEnhanced(
          chatPartner.address,
          isRedFlag,
          review,
          category,
          severity
        );
      }

      // Extract transaction hash and details
      const txHash = result.hash || result.receipt?.hash || result.receipt?.transactionHash;
      const blockNumber = result.blockNumber || result.receipt?.blockNumber;
      const gasUsed = result.gasUsed || result.receipt?.gasUsed;
      
      // Show detailed success message with transaction ID
      const flagId = result.flagId;
      const flagType = result.type || 'regular';
      
      const successMessage = `
🎉 ${isRedFlag ? 'Red' : 'Green'} Flag Submitted Successfully!
${flagType === 'encrypted' ? '🔐 (Encrypted)' : flagType === 'anonymous' ? '👤 (Anonymous)' : '📝 (Regular)'}

📋 Transaction Details:
• Transaction ID: ${txHash}
• Block Number: ${blockNumber?.toString() || 'Pending'}
• Gas Used: ${gasUsed?.toString() || 'N/A'}
${flagId ? `• Flag ID: ${flagId}` : ''}

🔗 View on Blockchain Explorer:
https://testnet.explorer.sapphire.oasis.dev/tx/${txHash}

Your flag has been permanently stored on the Oasis Sapphire blockchain! ✅
      `.trim();
      
      alert(successMessage);
      
      // Refresh partner data to show updated flags
      await loadPartnerData();
      
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(`Failed to submit flag: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold">
              {chatPartner?.avatar || 'E'}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{chatPartner?.name || 'Emma Rodriguez'}</h3>
                {/* Rating Tier Badge */}
                {partnerRating && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    partnerRating.ratingTier === 'Excellent' ? 'bg-green-500/20 text-green-200' :
                    partnerRating.ratingTier === 'Good' ? 'bg-blue-500/20 text-blue-200' :
                    partnerRating.ratingTier === 'Average' ? 'bg-yellow-500/20 text-yellow-200' :
                    partnerRating.ratingTier === 'Poor' ? 'bg-orange-500/20 text-orange-200' :
                    partnerRating.ratingTier === 'Dangerous' ? 'bg-red-500/20 text-red-200' :
                    'bg-gray-500/20 text-gray-200'
                  }`}>
                    {partnerRating.ratingTier} ({partnerRating.overallScore}/100)
                  </span>
                )}
                {partnerRating?.isRecommended && (
                  <span className="text-yellow-300 text-sm" title="Recommended user">⭐</span>
                )}
                {/* Flag Summary Badges */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setShowPartnerFlags(!showPartnerFlags)}
                    className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 rounded-full px-2 py-1 text-xs transition-colors"
                    disabled={isLoadingFlags}
                  >
                    <span className="text-red-300">🚩</span>
                    <span>{isLoadingFlags ? '...' : partnerFlags.redFlags.length}</span>
                  </button>
                  <button
                    onClick={() => setShowPartnerFlags(!showPartnerFlags)}
                    className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 rounded-full px-2 py-1 text-xs transition-colors"
                    disabled={isLoadingFlags}
                  >
                    <span className="text-green-300">💚</span>
                    <span>{isLoadingFlags ? '...' : partnerFlags.greenFlags.length}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-pink-100">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Debug wallet connection button */}
            <button
              onClick={async () => {
                try {
                  const address = await oasisService.connectWallet();
                  setWalletConnected(true);
                  setConnectionError(null);
                  await loadPartnerData();
                } catch (error) {
                  setConnectionError(error.message);
                }
              }}
              className={`text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors text-xs ${
                walletConnected ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}
              title={walletConnected ? 'Wallet Connected' : 'Connect Wallet'}
            >
              {walletConnected ? '🟢' : '🔴'} 💳
            </button>
            <button className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              📹
            </button>
            <button className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              📞
            </button>
            <button
              onClick={() => setShowFlagSubmission(true)}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors text-sm"
              title="Rate this person after your date"
            >
              🚩
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl font-bold p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Flag Details Panel */}
        {showPartnerFlags && (
          <div className="bg-white border-b border-gray-200 p-4 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                <span>🚩</span>
                <span>What others said about {chatPartner?.name || 'them'}</span>
              </h4>
              <button
                onClick={() => setShowPartnerFlags(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            
            {/* Rating Summary */}
            {partnerRating && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Overall Rating</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Overall:</span>
                    <span className="font-medium">{partnerRating.overallScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety:</span>
                    <span className="font-medium">{partnerRating.safetyScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Behavior:</span>
                    <span className="font-medium">{partnerRating.behaviorScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Communication:</span>
                    <span className="font-medium">{partnerRating.communicationScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kindness:</span>
                    <span className="font-medium">{partnerRating.kindnessScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reliability:</span>
                    <span className="font-medium">{partnerRating.reliabilityScore}/100</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {partnerRating.totalInteractions} interactions • {partnerRating.positivePercentage}% positive
                </div>
              </div>
            )}

            {!walletConnected && (
              <div className="text-center py-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Connect your wallet to view flag data</p>
                  <WalletConnectionHelper
                    onSuccess={handleWalletConnected}
                    onError={handleWalletError}
                  />
                  {connectionError && (
                    <p className="text-xs text-red-500 mt-2">{connectionError}</p>
                  )}
                </div>
              </div>
            )}

            {walletConnected && isLoadingFlags && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading flags...</p>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Red Flags */}
              {partnerFlags.redFlags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-600 mb-2 flex items-center space-x-1">
                    <span>🚩</span>
                    <span>Red Flags ({partnerFlags.redFlags.length})</span>
                  </h5>
                  <div className="space-y-2">
                    {partnerFlags.redFlags.map((flag) => (
                      <div key={flag.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm text-red-800 italic flex-1">&ldquo;{flag.comment}&rdquo;</p>
                          {flag.severity && (
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              flag.severity >= 8 ? 'bg-red-600 text-white' :
                              flag.severity >= 6 ? 'bg-red-500 text-white' :
                              flag.severity >= 4 ? 'bg-orange-500 text-white' :
                              'bg-yellow-500 text-white'
                            }`}>
                              {flag.severity}/10
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-red-600">{flag.reviewer} • {flag.date}</p>
                          {flag.category && (
                            <span className="text-xs bg-red-200 text-red-700 px-2 py-1 rounded-full">
                              {flag.category}
                            </span>
                          )}
                        </div>
                        {flag.isEncrypted && (
                          <div className="mt-1 text-xs text-red-500 flex items-center space-x-1">
                            <span>🔒</span>
                            <span>Privacy protected</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Green Flags */}
              {partnerFlags.greenFlags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-600 mb-2 flex items-center space-x-1">
                    <span>💚</span>
                    <span>Green Flags ({partnerFlags.greenFlags.length})</span>
                  </h5>
                  <div className="space-y-2">
                    {partnerFlags.greenFlags.map((flag) => (
                      <div key={flag.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 italic">&ldquo;{flag.comment}&rdquo;</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-green-600">{flag.reviewer} • {flag.date}</p>
                          {flag.category && (
                            <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full">
                              {flag.category}
                            </span>
                          )}
                        </div>
                        {flag.isEncrypted && (
                          <div className="mt-1 text-xs text-green-500 flex items-center space-x-1">
                            <span>🔒</span>
                            <span>Privacy protected</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 These are anonymous reviews from their previous dates. Use this info to guide your conversation!
              </p>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {/* Welcome Message */}
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border inline-block">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-sm text-gray-600">
                You and <span className="font-semibold text-pink-600">{chatPartner?.name || 'Emma'}</span> matched!
              </p>
              <p className="text-xs text-gray-500 mt-1">Start your conversation below</p>
            </div>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.isOwn
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm border'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.isOwn ? 'text-pink-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-2xl max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{chatPartner?.name || 'Emma'} is typing...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black"
                maxLength={500}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                😊
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-2 rounded-full transition-all duration-200 font-medium"
            >
              Send
            </button>
          </form>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex space-x-3 text-gray-400">
              <button className="hover:text-gray-600 transition-colors">📎</button>
              <button className="hover:text-gray-600 transition-colors">📷</button>
              <button className="hover:text-gray-600 transition-colors">🎤</button>
            </div>
            <p className="text-xs text-gray-500">
              {newMessage.length}/500
            </p>
          </div>
        </div>
      </div>

      {/* Flag Submission Modal */}
      <FlagSubmission
        isOpen={showFlagSubmission}
        onClose={() => setShowFlagSubmission(false)}
        datePartner={chatPartner}
        onSubmit={handleFlagSubmission}
      />
    </div>
  );
};

export default ChatBox; 