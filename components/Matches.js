import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import oasisService from '../utils/oasis';

const Matches = () => {
  const { userAddress, matches, submitFlag, approveFlag, loading } = useApp();
  const [matchProfiles, setMatchProfiles] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [flagModal, setFlagModal] = useState(false);
  const [flagData, setFlagData] = useState({
    isRedFlag: false,
    review: ''
  });

  useEffect(() => {
    loadMatchProfiles();
  }, [matches, loadMatchProfiles]);

  const loadMatchProfiles = useCallback(async () => {
    if (!matches.length) return;
    
    setLoading(true);
    try {
      const profiles = await Promise.all(
        matches.map(async (match) => {
          try {
            const profile = await oasisService.getUserProfile(match.userAddress);
            return {
              ...match,
              profile
            };
          } catch (error) {
            console.error(`Failed to load profile for ${match.userAddress}:`, error);
            return {
              ...match,
              profile: null
            };
          }
        })
      );
      
      setMatchProfiles(profiles.filter(p => p.profile !== null));
    } catch (error) {
      console.error('Failed to load match profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [matches]);

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    
    if (!flagData.review.trim()) {
      alert('Please enter a review');
      return;
    }

    if (flagData.review.length > 100) {
      alert('Review must be 100 characters or less');
      return;
    }

    try {
      await submitFlag(selectedMatch.address, flagData.isRedFlag, flagData.review);
      setFlagModal(false);
      setSelectedMatch(null);
      setFlagData({ isRedFlag: false, review: '' });
    } catch (error) {
      console.error('Failed to submit flag:', error);
    }
  };

  const handleApproveFlag = async (fromAddress) => {
    try {
      await approveFlag(fromAddress);
    } catch (error) {
      console.error('Failed to approve flag:', error);
    }
  };

  const openFlagModal = (match) => {
    setSelectedMatch(match);
    setFlagModal(true);
  };

  if (matchProfiles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Matches</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600">No matches yet. Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Matches</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchProfiles.map(({ address, profile }) => (
          <div key={address} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{profile.name}</h3>
              <span className="text-sm text-gray-500">{profile.age} years old</span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{profile.bio}</p>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Interests:</h4>
              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-rose-100 text-rose-800 rounded-full"
                  >
                    {interest}
                  </span>
                ))}
                {profile.interests.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{profile.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => openFlagModal({ address, profile })}
                className="flex-1 px-3 py-2 text-sm bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
              >
                Submit Flag
              </button>
              <button
                onClick={() => handleApproveFlag(address)}
                className="px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Flag Modal */}
      {flagModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Submit Flag for {selectedMatch.profile.name}
            </h3>
            
            <form onSubmit={handleFlagSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flag Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="flagType"
                      value="green"
                      checked={!flagData.isRedFlag}
                      onChange={() => setFlagData(prev => ({ ...prev, isRedFlag: false }))}
                      className="mr-2"
                    />
                    <span className="text-green-600">Green Flag (Good)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="flagType"
                      value="red"
                      checked={flagData.isRedFlag}
                      onChange={() => setFlagData(prev => ({ ...prev, isRedFlag: true }))}
                      className="mr-2"
                    />
                    <span className="text-red-600">Red Flag (Bad)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review (max 100 characters)
                </label>
                <textarea
                  value={flagData.review}
                  onChange={(e) => setFlagData(prev => ({ ...prev, review: e.target.value }))}
                  rows="3"
                  maxLength="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Share your experience..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {flagData.review.length}/100 characters
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setFlagModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:bg-rose-300 transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches; 