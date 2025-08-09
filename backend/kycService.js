require('dotenv').config();
const { ethers } = require('ethers');
const crypto = require('crypto');
const multer = require('multer');
const express = require('express');
const cors = require('cors');

// Mock KYC verification providers (replace with real services like Jumio, Onfido, etc.)
class KYCVerificationService {
    constructor() {
        this.providers = {
            'jumio': this.verifyWithJumio.bind(this),
            'onfido': this.verifyWithOnfido.bind(this),
            'mock': this.mockVerification.bind(this)
        };
    }

    // Mock verification for testing
    async mockVerification(documentData, personalData) {
        console.log('Mock KYC verification started...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock validation logic
        const isValid = documentData.documentType && 
                        documentData.documentNumber && 
                        personalData.fullName && 
                        personalData.dateOfBirth;
        
        return {
            success: isValid,
            confidence: isValid ? 0.95 : 0.1,
            provider: 'mock',
            documentType: documentData.documentType,
            verificationId: `mock_${Date.now()}`,
            timestamp: new Date().toISOString(),
            details: isValid ? 'Document verified successfully' : 'Invalid document data'
        };
    }

    // Jumio integration (placeholder)
    async verifyWithJumio(documentData, personalData) {
        // Integrate with Jumio API
        console.log('Jumio KYC verification...');
        return {
            success: true,
            confidence: 0.98,
            provider: 'jumio',
            documentType: documentData.documentType,
            verificationId: `jumio_${Date.now()}`,
            timestamp: new Date().toISOString()
        };
    }

    // Onfido integration (placeholder)
    async verifyWithOnfido(documentData, personalData) {
        // Integrate with Onfido API
        console.log('Onfido KYC verification...');
        return {
            success: true,
            confidence: 0.97,
            provider: 'onfido',
            documentType: documentData.documentType,
            verificationId: `onfido_${Date.now()}`,
            timestamp: new Date().toISOString()
        };
    }

    async verify(provider, documentData, personalData) {
        if (!this.providers[provider]) {
            throw new Error(`KYC provider ${provider} not supported`);
        }

        return await this.providers[provider](documentData, personalData);
    }
}

// Blockchain service for interacting with KYCProfile contract
class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = process.env.KYC_CONTRACT_ADDRESS;
        this.privateKey = process.env.BACKEND_PRIVATE_KEY;
    }

      async initialize() {
    // Check if contract address and private key are available
    if (!this.contractAddress || this.contractAddress === '0x0000000000000000000000000000000000000000') {
      console.log('🎭 MOCK MODE ENABLED - Contract address not set');
      console.log('   To use REAL blockchain transactions:');
      console.log('   1. Deploy contract: npx hardhat run scripts/deploy-kyc.js --network sapphireTestnet');
      console.log('   2. Update KYC_CONTRACT_ADDRESS in backend/.env');
      console.log('   3. Restart this service');
      this.mockMode = true;
      return;
    }

    if (!this.privateKey || this.privateKey === 'your_private_key_here' || this.privateKey === 'temp_key_for_testing') {
      console.log('🎭 MOCK MODE ENABLED - Private key not set');
      console.log('   To use REAL blockchain transactions:');
      console.log('   1. Add your private key to backend/.env: BACKEND_PRIVATE_KEY=0xyour_key_here');
      console.log('   2. Restart this service');
      this.mockMode = true;
      return;
    }

    try {
      // Connect to Oasis Sapphire Testnet
      this.provider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
      this.signer = new ethers.Wallet(this.privateKey, this.provider);

      // Contract ABI (simplified for backend use)
      const contractABI = [
        'function createProfile(address _user, string _username, uint256 _age, string _gender, string _fullName, string _bio, string[] _interests, uint256 _monthlySalary, string _profileImageHash) external',
        'function verifyKYC(address _user, string _documentType, string _encryptedDocumentNumber, string _kycDocumentHash, string _verificationProvider) external',
        'function getPublicProfile(address _user) external view returns (string username, uint256 age, string gender, bool isKYCVerified, bool isActive, uint256 createdAt)',
        'function getPrivateProfile(address _user) external view returns (string fullName, string bio, string[] interests, uint256 monthlySalary, string profileImageHash)',
        'function isRegistered(address _user) external view returns (bool)',
        'function authorizedVerifiers(address) external view returns (bool)'
      ];

      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);
      console.log('🚀 REAL BLOCKCHAIN MODE ENABLED!');
      console.log('   Contract Address:', this.contractAddress);
      console.log('   Network: Oasis Sapphire Testnet');
      console.log('   All transactions will be REAL blockchain transactions!');
      this.mockMode = false;
    } catch (error) {
      console.log('⚠️  Failed to initialize blockchain service - running in MOCK MODE:', error.message);
      this.mockMode = true;
    }
  }

      async createProfile(userAddress, profileData) {
    if (this.mockMode) {
      console.log('📝 MOCK: Creating profile for:', userAddress);
      return {
        hash: `mock_tx_${Date.now()}`,
        blockNumber: Math.floor(Math.random() * 1000000),
        status: 1
      };
    }

    try {
      console.log('Creating profile on blockchain for:', userAddress);
      
      const tx = await this.contract.createProfile(
        userAddress,
        profileData.username,
        profileData.age,
        profileData.gender,
        profileData.fullName,
        profileData.bio,
        profileData.interests,
        Math.floor(profileData.monthlySalary * 100), // Convert to cents
        profileData.profileImageHash
      );

      const receipt = await tx.wait();
      console.log('Profile created successfully:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  }

      async verifyKYC(userAddress, kycData) {
    if (this.mockMode) {
      console.log('✅ MOCK: Verifying KYC for:', userAddress);
      return {
        hash: `mock_kyc_tx_${Date.now()}`,
        blockNumber: Math.floor(Math.random() * 1000000),
        status: 1
      };
    }

    try {
      console.log('Verifying KYC on blockchain for:', userAddress);
      
      // Encrypt document number
      const encryptedDocNumber = this.encryptData(kycData.documentNumber);
      
      const tx = await this.contract.verifyKYC(
        userAddress,
        kycData.documentType,
        encryptedDocNumber,
        kycData.documentHash,
        kycData.provider
      );

      const receipt = await tx.wait();
      console.log('KYC verified successfully:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Failed to verify KYC:', error);
      throw error;
    }
  }

    encryptData(data) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_PASSWORD || 'default-password', 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return `${iv.toString('hex')}:${encrypted}`;
    }
}

// Express server setup
const app = express();
app.use(cors());
app.use(express.json());

// File upload configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed'), false);
        }
    }
});

// Initialize services
const kycService = new KYCVerificationService();
const blockchainService = new BlockchainService();

// Mock IPFS service (replace with real IPFS)
class IPFSService {
    static async uploadFile(file) {
        // Mock IPFS upload
        const hash = `Qm${crypto.randomBytes(22).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`;
        console.log(`Mock IPFS upload: ${file.originalname} -> ${hash}`);
        return hash;
    }
}

// API Routes

// Submit profile and ID for verification
app.post('/api/submit-profile', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            userAddress,
            username,
            fullName,
            age,
            gender,
            bio,
            interests,
            monthlySalary,
            documentType,
            documentNumber,
            dateOfBirth,
            kycProvider = 'mock'
        } = req.body;

        // Validate required fields
        if (!userAddress || !username || !fullName || !documentType || !documentNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Upload files to IPFS
        let profileImageHash = '';
        let idDocumentHash = '';

        if (req.files.profileImage) {
            profileImageHash = await IPFSService.uploadFile(req.files.profileImage[0]);
        }

        if (req.files.idDocument) {
            idDocumentHash = await IPFSService.uploadFile(req.files.idDocument[0]);
        }

        // Prepare data for KYC verification
        const documentData = {
            documentType,
            documentNumber,
            documentHash: idDocumentHash
        };

        const personalData = {
            fullName,
            dateOfBirth,
            age: parseInt(age)
        };

        // Perform KYC verification
        console.log('Starting KYC verification...');
        const kycResult = await kycService.verify(kycProvider, documentData, personalData);

        if (!kycResult.success) {
            return res.status(400).json({
                success: false,
                message: 'KYC verification failed',
                details: kycResult.details
            });
        }

        // Create profile on blockchain
        const profileData = {
            username,
            fullName,
            age: parseInt(age),
            gender,
            bio: bio || '',
            interests: interests ? interests.split(',').map(i => i.trim()) : [],
            monthlySalary: parseFloat(monthlySalary) || 0,
            profileImageHash
        };

        const profileReceipt = await blockchainService.createProfile(userAddress, profileData);

        // Verify KYC on blockchain
        const kycData = {
            documentType: kycResult.documentType,
            documentNumber: documentNumber,
            documentHash: idDocumentHash,
            provider: kycResult.provider
        };

        const kycReceipt = await blockchainService.verifyKYC(userAddress, kycData);

        res.json({
            success: true,
            message: 'Profile created and KYC verified successfully',
            data: {
                profileTransaction: profileReceipt.hash,
                kycTransaction: kycReceipt.hash,
                kycVerificationId: kycResult.verificationId,
                profileImageHash,
                idDocumentHash
            }
        });

    } catch (error) {
        console.error('Profile submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get user verification status
app.get('/api/user/:address/status', async (req, res) => {
  try {
    const { address } = req.params;

    if (blockchainService.mockMode) {
      // Mock response for testing
      return res.json({
        success: true,
        data: {
          isRegistered: false,
          isKYCVerified: false,
          mockMode: true
        }
      });
    }

    // Check if user is registered
    const isRegistered = await blockchainService.contract.isRegistered(address);
    
    if (!isRegistered) {
      return res.json({
        success: true,
        data: {
          isRegistered: false,
          isKYCVerified: false
        }
      });
    }

    // Get public profile
    const publicProfile = await blockchainService.contract.getPublicProfile(address);
    
    res.json({
      success: true,
      data: {
        isRegistered: true,
        isKYCVerified: publicProfile.isKYCVerified,
        username: publicProfile.username,
        isActive: publicProfile.isActive
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user status',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'KYC service is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
    }

    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await blockchainService.initialize();
        
        app.listen(PORT, () => {
            console.log(`KYC service running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    KYCVerificationService,
    BlockchainService,
    IPFSService
}; 