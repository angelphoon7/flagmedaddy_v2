import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const Profile = () => {
  const { userProfile, isVerified, updateProfile, loading, error } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: userProfile?.bio || '',
    interests: userProfile?.interests || []
  });
  const [interestInput, setInterestInput] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addInterest = () => {
    if (interestInput.trim() && editData.interests.length < 10) {
      setEditData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (index) => {
    setEditData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(editData.bio, editData.interests);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      bio: userProfile?.bio || '',
      interests: userProfile?.interests || []
    });
    setIsEditing(false);
  };

  if (!userProfile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600">No profile found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-800 font-medium">{userProfile.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Age</label>
              <p className="text-gray-800 font-medium">{userProfile.age} years old</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Bio</h3>
          {isEditing ? (
            <div>
              <textarea
                name="bio"
                value={editData.bio}
                onChange={handleInputChange}
                rows="4"
                maxLength="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Tell us about yourself"
              />
              <p className="text-sm text-gray-500 mt-1">
                {editData.bio.length}/500 characters
              </p>
            </div>
          ) : (
            <p className="text-gray-700">{userProfile.bio}</p>
          )}
        </div>

        {/* Interests */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Interests</h3>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Add an interest"
                  disabled={editData.interests.length >= 10}
                />
                <button
                  type="button"
                  onClick={addInterest}
                  disabled={!interestInput.trim() || editData.interests.length >= 10}
                  className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {editData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-rose-100 text-rose-800"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(index)}
                      className="ml-2 text-rose-600 hover:text-rose-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {editData.interests.length}/10 interests
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userProfile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 rounded-full text-sm bg-rose-100 text-rose-800"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Verification Status:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Member Since:</span>
              <span className="text-gray-800">
                {new Date(userProfile.createdAt * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:bg-rose-300 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 