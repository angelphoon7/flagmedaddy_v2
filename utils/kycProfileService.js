import { ethers } from 'ethers';

// Enhanced KYC Profile Service with debugging and error handling
class KYCProfileService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.NEXT_PUBLIC_KYC_PROFILE_CONTRACT_ADDRESS || "0x44b05391b71b58f92Cb545A7b53c5f140B414d0f";
    this.expectedChainIdHex = '0x5aff'; // Oasis Sapphire Testnet (23295)
    this.expectedChainIdDec = 23295n;
  }

  async initialize() {
    try {
      if (!this.contractAddress) {
        throw new Error('KYC Profile contract address not configured');
      }

      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Ensure we're on Oasis Sapphire Testnet
        await this.ensureCorrectNetwork();
        
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        // Verify contract code exists at address on this chain
        const code = await this.provider.getCode(this.contractAddress);
        if (!code || code === '0x') {
          throw new Error(`No contract code found at ${this.contractAddress} on current network. Please verify the contract address and selected network (Oasis Sapphire Testnet).`);
        }

        this.contract = new ethers.Contract(this.contractAddress, KYC_PROFILE_ABI, this.signer);
        
        const network = await this.provider.getNetwork();
        console.log('KYC Profile Service initialized:', {
          contractAddress: this.contractAddress,
          signerAddress: await this.signer.getAddress(),
          chainId: network.chainId?.toString?.() || network.chainId,
        });
        
        return true;
      } else {
        throw new Error('MetaMask not found');
      }
    } catch (error) {
      console.error('Failed to initialize KYC Profile Service:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.contract) {
      await this.initialize();
    }
    // Re-validate network on subsequent calls
    await this.ensureCorrectNetwork();
  }

 // Ensure user is on Oasis Sapphire Testnet, prompt to switch/add chain if not
 async ensureCorrectNetwork() {
   if (typeof window === 'undefined' || !window.ethereum) return;
   try {
     const currentChainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
     if (currentChainIdHex !== this.expectedChainIdHex) {
       console.warn(`Wrong network detected: ${currentChainIdHex}. Attempting to switch to Oasis Sapphire Testnet (${this.expectedChainIdHex})...`);
       try {
         await window.ethereum.request({
           method: 'wallet_switchEthereumChain',
           params: [{ chainId: this.expectedChainIdHex }],
         });
       } catch (switchError) {
         // If the chain is not added to MetaMask, add it
         if (switchError.code === 4902 || (switchError.data && switchError.data.originalError?.code === 4902)) {
           await window.ethereum.request({
             method: 'wallet_addEthereumChain',
             params: [{
               chainId: this.expectedChainIdHex,
               chainName: 'Oasis Sapphire Testnet',
               rpcUrls: ['https://testnet.sapphire.oasis.dev'],
               nativeCurrency: { name: 'ROSE', symbol: 'ROSE', decimals: 18 },
               blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev']
             }],
           });
         } else {
           throw switchError;
         }
       }
     }
   } catch (err) {
     console.warn('Network check/switch failed:', err);
   }
 }

  /**
   * Debug function to check contract state before profile creation
   */
  async debugProfileCreation(profileData) {
    await this.ensureInitialized();
    const signerAddress = await this.signer.getAddress();
    
    console.log('=== DEBUG: Profile Creation Pre-checks ===');
    
    try {
      // 1. Check if user is already registered (check signer's address since they create for themselves)
      const isAlreadyRegistered = await this.contract.isRegistered(signerAddress);
      console.log('1. User already registered:', isAlreadyRegistered);
      
      // 2. Check if signer is authorized verifier (not needed for self-service)
      const isAuthorizedVerifier = await this.contract.authorizedVerifiers(signerAddress);
      console.log('2. Signer is authorized verifier:', isAuthorizedVerifier);
      
      // 3. Check if signer is owner
      const owner = await this.contract.owner();
      const isOwner = signerAddress.toLowerCase() === owner.toLowerCase();
      console.log('3. Signer is owner:', isOwner);
      console.log('   Owner address:', owner);
      console.log('   Signer address:', signerAddress);
      
      // 4. Validate form data
      console.log('4. Form data validation:');
      console.log('   Username length:', profileData.username?.length || 0);
      console.log('   Age:', profileData.age, 'Valid:', profileData.age >= 18 && profileData.age <= 100);
      console.log('   Full name length:', profileData.fullName?.length || 0);
      
      // 5. Check network and gas
      const network = await this.provider.getNetwork();
      console.log('5. Network info:', network.name, network.chainId);
      
      const balance = await this.provider.getBalance(signerAddress);
      console.log('6. Wallet balance:', ethers.formatEther(balance), 'ETH');
      
      return {
        isAlreadyRegistered,
        isAuthorizedVerifier,
        isOwner,
        canProceed: !isAlreadyRegistered // For self-service, anyone can create if not already registered
      };
      
    } catch (error) {
      console.error('Debug checks failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced createProfile with better error handling and debugging
   */
  async createProfile(profileData, files) {
    await this.ensureInitialized();

    try {
      console.log('Creating profile on blockchain...', profileData);

      // Run debug checks first
      const debugInfo = await this.debugProfileCreation(profileData);
      
      if (debugInfo.isAlreadyRegistered) {
        throw new Error('User already registered. Cannot create duplicate profile.');
      }

      const signerAddress = await this.signer.getAddress();

      // Validate and clean data first
      const cleanedData = this.validateAndCleanProfileData(profileData);

      // Handle authorization - with self-service contract, users create profiles for themselves
      // The contract automatically uses msg.sender as the user address
      console.log('Self-service contract: User creates profile for themselves automatically');
      
      // Prepare files
      const profileImageHash = files.profileImage ? `ipfs://${this.generateMockHash(files.profileImage.name)}` : '';

      console.log('Final contract call parameters:', cleanedData);

      // Estimate gas first to catch issues early
      try {
        const gasEstimate = await this.contract.estimateGas.createProfile(
          cleanedData.username,
          cleanedData.age,
          cleanedData.gender,
          cleanedData.fullName,
          cleanedData.bio,
          cleanedData.interests,
          cleanedData.monthlySalary,
          profileImageHash
        );
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw new Error(`Transaction would fail: ${this.parseRevertReason(gasError)}`);
      }

      // Create the transaction with explicit gas limit
      const tx = await this.contract.createProfile(
        cleanedData.username,
        cleanedData.age,
        cleanedData.gender,
        cleanedData.fullName,
        cleanedData.bio,
        cleanedData.interests,
        cleanedData.monthlySalary,
        profileImageHash,
        {
          gasLimit: 10000000 // Max gas limit
        }
      );

      console.log('Profile creation transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Profile creation confirmed:', receipt);

      // Handle KYC submission
      let kycResult = null;
      if (cleanedData.documentNumber && cleanedData.documentType) {
        try {
          kycResult = await this.submitKYCVerification(cleanedData, files);
        } catch (kycError) {
          console.warn('KYC submission failed, but profile was created:', kycError);
        }
      }

      return {
        success: true,
        data: {
          profileTransaction: tx.hash,
          profileBlockNumber: receipt.blockNumber,
          profileGasUsed: receipt.gasUsed?.toString(),
          kycTransaction: kycResult?.hash || null,
          kycBlockNumber: kycResult?.blockNumber || null,
          kycGasUsed: kycResult?.gasUsed?.toString() || null,
          kycVerificationId: cleanedData.userAddress,
          explorerLinks: {
            profile: `https://testnet.explorer.sapphire.oasis.dev/tx/${tx.hash}`,
            kyc: kycResult ? `https://testnet.explorer.sapphire.oasis.dev/tx/${kycResult.hash}` : null
          }
        }
      };

    } catch (error) {
      console.error('Profile creation failed:', error);
      const errorMessage = this.parseRevertReason(error);
      throw new Error(`Profile creation failed: ${errorMessage}`);
    }
  }

  /**
   * Validate and clean profile data
   */
  validateAndCleanProfileData(profileData) {
    // Validate required fields
    if (!profileData.username || profileData.username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    if (!profileData.age || profileData.age < 18 || profileData.age > 100) {
      throw new Error('Age must be between 18 and 100');
    }
    if (!profileData.fullName || profileData.fullName.trim().length === 0) {
      throw new Error('Full name cannot be empty');
    }
    if (!profileData.userAddress || !ethers.isAddress(profileData.userAddress)) {
      throw new Error('Invalid user address');
    }

    // Clean and process interests
    let interestsArray = [];
    if (typeof profileData.interests === 'string') {
      interestsArray = profileData.interests.split(',').map(i => i.trim()).filter(i => i.length > 0);
    } else if (Array.isArray(profileData.interests)) {
      interestsArray = profileData.interests.filter(i => i && i.length > 0);
    }
    
    if (interestsArray.length === 0) {
      interestsArray = ['general'];
    }

    return {
      userAddress: profileData.userAddress,
      username: profileData.username.trim(),
      age: parseInt(profileData.age),
      gender: profileData.gender?.trim() || 'Other',
      fullName: profileData.fullName.trim(),
      bio: profileData.bio?.trim() || 'No bio provided',
      interests: interestsArray,
      monthlySalary: Math.floor((parseFloat(profileData.monthlySalary) || 0) * 100),
      documentType: profileData.documentType || 'passport',
      documentNumber: profileData.documentNumber || ''
    };
  }

  /**
   * Submit KYC verification separately (for self-service contract)
   */
  async submitKYCVerification(cleanedData, files) {
    try {
      const encryptedDocNumber = this.encryptDocumentNumber(cleanedData.documentNumber);
      const kycDocHash = files.idDocument ? `ipfs://${this.generateMockHash(files.idDocument.name)}` : '';
      
      const kycTx = await this.contract.submitKYCDocuments(
        cleanedData.documentType,
        encryptedDocNumber,
        kycDocHash,
        {
          gasLimit: 10000000 // Max gas limit for KYC
        }
      );

      console.log('KYC verification transaction sent:', kycTx.hash);
      const kycReceipt = await kycTx.wait();
      console.log('KYC verification confirmed:', kycReceipt);

      return kycReceipt;
    } catch (error) {
      console.error('KYC verification failed:', error);
      throw error;
    }
  }

  /**
   * Parse revert reason from error
   */
  parseRevertReason(error) {
    if (error.message) {
      // Look for common revert reasons
      if (error.message.includes('User already registered')) {
        return 'User is already registered with this address';
      }
      if (error.message.includes('Not authorized to verify KYC')) {
        return 'Wallet not authorized to create profiles. Contact administrator.';
      }
      if (error.message.includes('Username cannot be empty')) {
        return 'Username cannot be empty';
      }
      if (error.message.includes('Age must be between 18 and 100')) {
        return 'Age must be between 18 and 100';
      }
      if (error.message.includes('Full name cannot be empty')) {
        return 'Full name cannot be empty';
      }
      if (error.message.includes('insufficient funds')) {
        return 'Insufficient funds for gas fees';
      }
      if (error.message.includes('gas')) {
        return 'Gas related error - try increasing gas limit';
      }
      if (error.message.includes('could not decode result data')) {
        return 'Could not decode result from contract. This usually means the contract address or selected network is wrong. Please ensure you are on Oasis Sapphire Testnet and the KYC contract address is correct.';
      }
      
      return error.message;
    }
    return 'Unknown error occurred';
  }

  // Keep existing utility methods
  async isUserRegistered(userAddress) {
    await this.ensureInitialized();
    
    try {
      return await this.contract.isRegistered(userAddress);
    } catch (error) {
      console.error('Failed to check registration status:', error);
      return false;
    }
  }

  encryptDocumentNumber(documentNumber) {
    return btoa(documentNumber + '_encrypted_' + Date.now());
  }

  generateMockHash(filename) {
    const hash = btoa(filename + Date.now()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 46);
    return `Qm${hash}`;
  }

  getContractAddress() {
    return this.contractAddress;
  }

  isInitialized() {
    return !!this.contract;
  }
}

// Updated ABI for KYCProfileSelfService contract
const KYC_PROFILE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "KYCVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ProfileCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ProfileUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "viewer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ViewerAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "viewer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ViewerRevoked",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_verifier",
        "type": "address"
      }
    ],
    "name": "addAuthorizedVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_viewer",
        "type": "address"
      }
    ],
    "name": "authorizeViewer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedVerifiers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_username",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_age",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_gender",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_fullName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_bio",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_interests",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "_monthlySalary",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_profileImageHash",
        "type": "string"
      }
    ],
    "name": "createProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_documentType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_encryptedDocumentNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_kycDocumentHash",
        "type": "string"
      }
    ],
    "name": "submitKYCDocuments",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getPublicProfile",
    "outputs": [
      {
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "age",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "gender",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isKYCVerified",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalUsers",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Export singleton instance
const kycProfileService = new KYCProfileService();
export default kycProfileService;