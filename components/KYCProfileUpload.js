import { useState, useEffect } from 'react';
import kycService from '../utils/kycService';

const KYCProfileUpload = ({ onComplete, userAddress }) => {
  const [formData, setFormData] = useState({
    // Profile data
    username: '',
    fullName: '',
    age: '',
    gender: '',
    bio: '',
    interests: '',
    monthlySalary: '',
    dateOfBirth: '',
    // KYC data
    documentType: 'passport',
    documentNumber: '',
    // Files
    profileImage: null,
    idDocument: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Profile Info, 2: KYC Info, 3: File Upload
  const [walletConnected, setWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize wallet connection when component mounts
  useEffect(() => {
    const initializeWallet = async () => {
      if (userAddress && !kycService.isWalletConnected()) {
        setIsConnecting(true);
        try {
          const connectedAddress = await kycService.connectWallet();
          setWalletConnected(true);
        } catch (error) {
          setWalletConnected(false);
        } finally {
          setIsConnecting(false);
        }
      } else if (kycService.isWalletConnected()) {
        setWalletConnected(true);
      }
    };

    initializeWallet();
  }, [userAddress]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Simple hash function for file content (for demo purposes)
  const generateFileHash = async (file) => {
    if (!file) return '';
    
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      return file.name + '_' + Date.now(); // Fallback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Ensure wallet is connected and contract is initialized
      if (!kycService.isWalletConnected()) {
        const connectedAddress = await kycService.connectWallet();
        
        // Verify the connected address matches the expected userAddress
        if (connectedAddress.toLowerCase() !== userAddress.toLowerCase()) {
          throw new Error('Connected wallet address does not match expected address');
        }
      }

      // Generate file hashes
      const profileImageHash = await generateFileHash(formData.profileImage);
      const idDocumentHash = await generateFileHash(formData.idDocument);

      // Prepare profile data
      const profileData = {
        username: formData.username,
        fullName: formData.fullName,
        age: parseInt(formData.age) || 25,
        gender: formData.gender,
        bio: formData.bio,
        interests: formData.interests.split(',').map(i => i.trim()),
        monthlySalaryCents: parseInt(formData.monthlySalary) * 100 || 0,
        dateOfBirth: formData.dateOfBirth,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        profileImageHash,
        idDocumentHash
      };

      // Save credentials to blockchain
      const result = await kycService.saveCredentials(profileData);

      // Create profile object for app state
      const appProfileData = {
        name: formData.fullName,
        username: formData.username,
        age: parseInt(formData.age) || 25,
        gender: formData.gender,
        bio: formData.bio,
        interests: formData.interests.split(',').map(i => i.trim()),
        isKYCVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        walletAddress: userAddress,
        transactionHash: result.hash,
        blockNumber: result.blockNumber
      };

      // Call the completion callback
      onComplete(appProfileData);

    } catch (error) {
      // Handle specific error cases
      let errorMessage = 'Failed to create profile. Please try again.';
      
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ROSE tokens for gas fees. Please add ROSE to your wallet.';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('contract')) {
        errorMessage = 'Contract interaction failed. Please try again.';
      } else if (error.message.includes('wallet address')) {
        errorMessage = 'Wallet address mismatch. Please reconnect your wallet.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Basic Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Choose a unique username"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Your full name"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="25"
            min="18"
            max="100"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Tell us about yourself..."
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
        <input
          type="text"
          name="interests"
          value={formData.interests}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Travel, Music, Cooking (comma separated)"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={nextStep}
          disabled={!formData.username || !formData.fullName || !formData.age || !formData.gender}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 2: KYC Information</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary</label>
          <input
            type="number"
            name="monthlySalary"
            value={formData.monthlySalary}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="5000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
          <select
            name="documentType"
            value={formData.documentType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          >
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver&apos;s License</option>
            <option value="national_id">National ID</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Number *</label>
          <input
            type="text"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Document number"
            required
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={!formData.dateOfBirth || !formData.documentNumber}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 3: File Upload</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'profileImage')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Upload a profile picture (optional)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ID Document *</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange(e, 'idDocument')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Upload your ID document for KYC verification</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-500 text-sm">🔒</div>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Privacy & Security</p>
            <ul className="space-y-1">
              <li>• Your documents are encrypted and stored securely</li>
              <li>• Only verified information is shared with matches</li>
              <li>• KYC verification ensures a safe dating environment</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
        >
          Previous
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.idDocument}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Profile...</span>
            </div>
          ) : (
            'Create Profile'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      {/* Progress indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                currentStep >= step 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Contract: 0x5936baC9550F03Ca6a57E2098Ab0Ce0447263ff6
        </p>
        {isConnecting && (
          <p className="text-xs text-blue-500 mt-1">🔄 Initializing wallet...</p>
        )}
        {walletConnected && !isConnecting && (
          <p className="text-xs text-green-500 mt-1">✅ Wallet connected</p>
        )}
        {!walletConnected && !isConnecting && (
          <p className="text-xs text-red-500 mt-1">❌ Wallet not connected</p>
        )}
      </div>
    </div>
  );
};

export default KYCProfileUpload;