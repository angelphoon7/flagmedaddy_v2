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
          console.log('Initializing wallet connection...');
          const connectedAddress = await kycService.connectWallet();
          console.log('Wallet initialized:', connectedAddress);
          setWalletConnected(true);
        } catch (error) {
          console.error('Failed to initialize wallet:', error);
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
      console.error('Error generating file hash:', error);
      return file.name + '_' + Date.now(); // Fallback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Submitting profile for KYC verification...');
      console.log('Form data:', formData);
      console.log('User address:', userAddress);

      // Ensure wallet is connected and contract is initialized
      if (!kycService.isWalletConnected()) {
        console.log('Wallet not connected, connecting now...');
        const connectedAddress = await kycService.connectWallet();
        console.log('Wallet connected:', connectedAddress);
        
        // Verify the connected address matches the expected userAddress
        if (connectedAddress.toLowerCase() !== userAddress.toLowerCase()) {
          throw new Error('Connected wallet address does not match expected address');
        }
      }

      // Generate file hashes
      console.log('Generating file hashes...');
      const profileImageHash = await generateFileHash(formData.profileImage);
      const idDocumentHash = await generateFileHash(formData.idDocument);
      console.log('File hashes generated:', { profileImageHash, idDocumentHash });

      // Prepare profile data for blockchain submission
      const profileData = {
        username: formData.username,
        fullName: formData.fullName,
        age: parseInt(formData.age),
        gender: formData.gender,
        bio: formData.bio,
        interests: formData.interests, // Keep as string
        monthlySalaryCents: Math.round(parseFloat(formData.monthlySalary) * 100), // Convert to cents
        dateOfBirth: formData.dateOfBirth,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        profileImageHash: profileImageHash,
        idDocumentHash: idDocumentHash
      };

      console.log('Prepared profile data:', profileData);

      // Validate profile data
      const validationErrors = kycService.validateProfileData(profileData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Submit to blockchain
      console.log('Submitting to blockchain...');
      const result = await kycService.saveCredentials(profileData);
      console.log('Profile submission successful:', result);

      // Show success message
      const transactionDetails = `
🎉 Profile Successfully Created on Oasis Sapphire Blockchain!

📋 Transaction Details:
• Transaction Hash: ${result.hash}
• Block Number: ${result.blockNumber || 'Pending'}
• Gas Used: ${result.gasUsed || 'N/A'}

🔗 View on Blockchain Explorer:
https://testnet.explorer.sapphire.oasis.dev/tx/${result.hash}

Your profile is now permanently stored on the blockchain! ✅
      `;
      
      alert(transactionDetails);
      
      // Log to console for easy copying
      console.log('🎉 PROFILE CREATION SUCCESS 🎉');
      console.log('Transaction Hash:', result.hash);
      console.log('Explorer Link:', `https://testnet.explorer.sapphire.oasis.dev/tx/${result.hash}`);
      
      onComplete({
        username: formData.username,
        isRegistered: true,
        transactionHash: result.hash,
        blockNumber: result.blockNumber
      });

    } catch (error) {
      console.error('Profile submission failed:', error);
      alert(`Profile submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-3xl mb-4">👤</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Profile Information</h3>
        <p className="text-gray-600">Step 1 of 3: Basic profile details</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username *
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Choose a unique username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Enter your full legal name"
        />
        <p className="text-xs text-gray-500 mt-1">Must match your ID document</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age *
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            required
            min="18"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
            placeholder="Age"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date of Birth *
        </label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
        />
        <p className="text-xs text-gray-500 mt-1">Must match your ID document</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bio *
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          required
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Interests *
        </label>
        <input
          type="text"
          name="interests"
          value={formData.interests}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="e.g., Travel, Music, Sports"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Salary (USD) *
        </label>
        <input
          type="number"
          name="monthlySalary"
          value={formData.monthlySalary}
          onChange={handleInputChange}
          required
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Enter monthly salary"
        />
      </div>

      <button
        type="button"
        onClick={nextStep}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
      >
        Next: KYC Information →
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-3xl mb-4">🆔</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">KYC Verification</h3>
        <p className="text-gray-600">Step 2 of 3: Identity verification details</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Type *
        </label>
        <select
          name="documentType"
          value={formData.documentType}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
        >
          <option value="passport">Passport</option>
          <option value="driver_license">Driver's License</option>
          <option value="national_id">National ID Card</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Number *
        </label>
        <input
          type="text"
          name="documentNumber"
          value={formData.documentNumber}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
          placeholder="Enter document number"
        />
        <p className="text-xs text-gray-500 mt-1">This information is encrypted and stored securely</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-500 mr-3 mt-0.5">🔒</div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">Privacy & Security</h4>
            <p className="text-sm text-blue-700">
              Your information is encrypted and stored on Oasis Sapphire, a privacy-focused blockchain. 
              Your sensitive data is protected by confidential smart contracts.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          Next: Upload Files →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-3xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Documents</h3>
        <p className="text-gray-600">Step 3 of 3: Upload your files for verification</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Image *
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'profileImage')}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
        />
        <p className="text-xs text-gray-500 mt-1">Clear photo of yourself (JPG, PNG, WebP)</p>
        {formData.profileImage && (
          <p className="text-xs text-green-600 mt-1">✓ {formData.profileImage.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID Document *
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileChange(e, 'idDocument')}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
        />
        <p className="text-xs text-gray-500 mt-1">
          Clear photo or scan of your {formData.documentType.replace('_', ' ')} (JPG, PNG, PDF)
        </p>
        {formData.idDocument && (
          <p className="text-xs text-green-600 mt-1">✓ {formData.idDocument.name}</p>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-3 mt-0.5">⚠️</div>
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-1">Important</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Ensure your ID document is clearly visible and readable</li>
              <li>• Your name on the ID must match the full name entered above</li>
              <li>• Files are hashed and stored securely on the blockchain</li>
              <li>• Your profile will be immediately available after submission</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.profileImage || !formData.idDocument}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          {isSubmitting ? 'Submitting to Blockchain...' : 'Submit Profile'}
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