import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const UserRegistration = ({ onComplete }) => {
  const { registerUser, loading, error } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    interests: []
  });
  const [interestInput, setInterestInput] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addInterest = () => {
    if (interestInput.trim() && formData.interests.length < 10) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (index) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.age || !formData.bio.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.interests.length === 0) {
      alert('Please add at least one interest');
      return;
    }

    try {
      await registerUser(
        formData.name,
        parseInt(formData.age),
        formData.bio,
        formData.interests
      );
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Your Dating Profile</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age *
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            min="18"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="Enter your age"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio *
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows="4"
            maxLength="500"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            placeholder="Tell us about yourself (max 500 characters)"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.bio.length}/500 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interests * (max 10)
          </label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="Add an interest"
              disabled={formData.interests.length >= 10}
            />
            <button
              type="button"
              onClick={addInterest}
              disabled={!interestInput.trim() || formData.interests.length >= 10}
              className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest, index) => (
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
          <p className="text-sm text-gray-500 mt-1">
            {formData.interests.length}/10 interests
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• You must be 18 or older to use this app</li>
            <li>• Your profile will be reviewed before verification</li>
            <li>• Only verified users can match and submit flags</li>
            <li>• All data is stored on Oasis Sapphire blockchain</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Profile...
            </div>
          ) : (
            'Create Profile'
          )}
        </button>
      </form>
    </div>
  );
};

export default UserRegistration; 