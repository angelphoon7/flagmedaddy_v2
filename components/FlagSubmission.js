import { useState } from 'react';

const FlagSubmission = ({ isOpen, onClose, datePartner, onSubmit }) => {
  const [flagType, setFlagType] = useState(''); // 'red' or 'green'
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flagType || !comment.trim()) return;

    setIsSubmitting(true);

    try {
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const flagData = {
        type: flagType,
        comment: comment.trim(),
        targetUser: datePartner,
        timestamp: new Date(),
        reviewer: 'Anonymous' // Always anonymous
      };

      onSubmit(flagData);
      
      // Reset form
      setFlagType('');
      setComment('');
      
      // Show success message
      const flagEmoji = flagType === 'red' ? '🚩' : '💚';
      alert(`${flagEmoji} Your ${flagType} flag has been submitted anonymously!`);
      
      onClose();
    } catch (error) {
      console.error('Flag submission error:', error);
      alert('Failed to submit flag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🚩</div>
              <div>
                <h2 className="text-xl font-bold">Rate Your Date</h2>
                <p className="text-pink-100 text-sm">Share your experience anonymously</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              {datePartner?.avatar || 'U'}
            </div>
            <h3 className="font-semibold text-gray-800">How was your date with</h3>
            <p className="text-lg font-bold text-pink-600">{datePartner?.name || 'Unknown'}?</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Flag Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose your flag type:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFlagType('red')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    flagType === 'red'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-300 text-gray-700'
                  }`}
                >
                  <div className="text-3xl mb-2">🚩</div>
                  <div className="font-semibold">Red Flag</div>
                  <div className="text-xs">Something concerning</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFlagType('green')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    flagType === 'green'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300 text-gray-700'
                  }`}
                >
                  <div className="text-3xl mb-2">💚</div>
                  <div className="font-semibold">Green Flag</div>
                  <div className="text-xs">Something positive</div>
                </button>
              </div>
            </div>

            {/* Comment Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your experience (max 100 characters):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe what happened during your date..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black resize-none"
                rows="3"
                maxLength={100}
                required
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Your review will be anonymous</p>
                <p className="text-xs text-gray-500">{comment.length}/100</p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="text-blue-500 text-sm">🔒</div>
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Privacy Protected</p>
                  <ul className="space-y-1">
                    <li>• Your identity remains completely anonymous</li>
                    <li>• Only {datePartner?.name || 'they'} can see this flag</li>
                    <li>• Helps future daters make informed decisions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!flagType || !comment.trim() || isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                `Submit ${flagType === 'red' ? '🚩 Red' : flagType === 'green' ? '💚 Green' : ''} Flag`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FlagSubmission; 