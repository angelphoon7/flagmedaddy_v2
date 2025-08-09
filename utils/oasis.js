import { BrowserProvider, Contract } from 'ethers';

// Oasis Sapphire testnet configuration
const SAPPHIRE_TESTNET_RPC = 'https://testnet.sapphire.oasis.dev';
const SAPPHIRE_TESTNET_CHAIN_ID = 0x5aff; // 23295 in decimal

// Contract ABI (enhanced Flag contract with rating system)
const CONTRACT_ABI = [
  // User management
  'function registerUser(address user)',
  'function verifyUser(address user)',
  'function createMatch(address user1, address user2)',
  'function isVerifiedUser(address user) view returns (bool)',
  'function hasMatched(address user1, address user2) view returns (bool)',
  
  // Flag submission functions
  'function submitFlag(address to, bool isRedFlag, string review, string category, uint8 severity) returns (bytes32)',
  'function submitEncryptedFlag(address to, bool isRedFlag, bytes encryptedReview, string category, uint8 severity) returns (bytes32)',
  'function submitAnonymousFlag(address to, bool isRedFlag, string review, string category, uint8 severity) returns (bytes32)',
  
  // Flag approval and viewing
  'function approveFlag(bytes32 flagId)',
  'function batchApproveFlags(bytes32[] flagIds)',
  'function getVisibleFlags(address user) view returns (tuple(address from, address to, bool isRedFlag, string review, bytes encryptedReview, uint256 timestamp, bool isVisible, bytes32 flagId, bool isEncrypted, uint8 severity, string category)[])',
  'function getVisibleRedFlags(address user) view returns (tuple(address from, address to, bool isRedFlag, string review, bytes encryptedReview, uint256 timestamp, bool isVisible, bytes32 flagId, bool isEncrypted, uint8 severity, string category)[])',
  'function getVisibleGreenFlags(address user) view returns (tuple(address from, address to, bool isRedFlag, string review, bytes encryptedReview, uint256 timestamp, bool isVisible, bytes32 flagId, bool isEncrypted, uint8 severity, string category)[])',
  'function getFlagById(bytes32 flagId, address requester) view returns (tuple(address from, address to, bool isRedFlag, string review, bytes encryptedReview, uint256 timestamp, bool isVisible, bytes32 flagId, bool isEncrypted, uint8 severity, string category))',
  
  // Statistics and ratings
  'function getFlagStatistics(address user) view returns (tuple(uint256 totalFlags, uint256 redFlags, uint256 greenFlags, uint256 visibleFlags, uint256 pendingFlags, uint256 averageRating))',
  'function getUserRating(address user) view returns (tuple(uint256 overallScore, uint256 safetyScore, uint256 behaviorScore, uint256 communicationScore, uint256 kindnessScore, uint256 reliabilityScore, string ratingTier, uint256 totalInteractions, uint256 positivePercentage, bool isRecommended))',
  'function getCategoryStats(address user, string category) view returns (tuple(uint256 totalCount, uint256 redCount, uint256 greenCount, uint256 averageSeverity, uint256 categoryScore))',
  'function getFlagTypeDistribution(address user) view returns (string[] categories, uint256[] redCounts, uint256[] greenCounts, uint256[] categoryScores)',
  'function getUsersByRatingTier(string tier) view returns (address[])',
  'function getRecommendedUsers() view returns (address[])',
  
  // Utility functions
  'function generateEncryptionSeed() view returns (bytes32)',
  'function encryptFlagReview(string review, bytes32 key) pure returns (bytes)',
  'function isValidCategory(string category) view returns (bool)',
  'function getFlagCategories() view returns (string[])',
  'function getContractStats() view returns (uint256, uint256, uint256)',
  'function userReputation(address user) view returns (uint256)',
  'function lastRatingUpdate(address user) view returns (uint256)',
  
  // Events
  'event FlagSubmitted(address indexed from, address indexed to, bool isRedFlag, bytes32 indexed flagId, string category)',
  'event EncryptedFlagSubmitted(address indexed from, address indexed to, bool isRedFlag, bytes32 indexed flagId)',
  'event AnonymousFlagSubmitted(address indexed to, bool isRedFlag, bytes32 indexed flagId, string category)',
  'event FlagApproved(address indexed user, bytes32 indexed flagId, address indexed approver)',
  'event RatingUpdated(address indexed user, uint256 overallScore, string ratingTier)',
  'event CategoryScoreUpdated(address indexed user, string category, uint256 score)',
  'event RecommendationStatusChanged(address indexed user, bool isRecommended)',
  'event UserVerified(address indexed user)',
  'event MatchCreated(address indexed user1, address indexed user2)',
  'event ReputationUpdated(address indexed user, uint256 newReputation)'
];

class OasisService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
  }

  async initialize() {
    try {
      // Don't auto-detect to avoid extension conflicts
      // Let users manually trigger connection
      return false;
    } catch (error) {
      console.error('Failed to initialize wallet service:', error);
      return false;
    }
  }

  async initializeContract() {
    try {
      // Get contract address from environment variable
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 
                             process.env.NEXT_PUBLIC_FLAG_CONTRACT_ADDRESS;
      
      if (!contractAddress || contractAddress === 'your_deployed_contract_address_here') {
        console.warn('Flag contract address not set. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file');
        return false;
      }

      if (!this.provider || !this.signer) {
        throw new Error('Provider and signer must be initialized first');
      }

      // Create contract instance
      this.contract = new Contract(contractAddress, CONTRACT_ABI, this.signer);
      this.contractAddress = contractAddress;
      
      console.log('Flag contract initialized:', contractAddress);
      return true;
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      throw error;
    }
  }

  detectWallet() {
    if (typeof window === 'undefined') return false;
    
    // Don't try to detect wallets automatically to avoid extension conflicts
    // Let users manually trigger connection instead
    return false;
  }

  async connectWallet() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection is only available in browser environment');
      }

      // Completely isolate wallet connection to avoid extension conflicts
      return new Promise((resolve, reject) => {
        // Use setTimeout to defer execution and avoid immediate extension conflicts
        setTimeout(async () => {
          try {
            // Check for ethereum object
            if (!window.ethereum) {
              reject(new Error('MetaMask not found. Please install MetaMask extension.'));
              return;
            }

            // Check if it's MetaMask
            if (!window.ethereum.isMetaMask) {
              reject(new Error('Please use MetaMask wallet. Other wallets are not supported.'));
              return;
            }

            // Request accounts with timeout
            const accountsPromise = window.ethereum.request({
              method: 'eth_requestAccounts'
            });

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Connection timeout')), 10000);
            });

            const accounts = await Promise.race([accountsPromise, timeoutPromise]);

            if (!accounts || accounts.length === 0) {
              reject(new Error('No accounts found. Please unlock MetaMask.'));
              return;
            }

            const address = accounts[0];
            console.log('Connected to MetaMask:', address);

            // Create provider and signer
            this.provider = new BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Auto-initialize contract if address is available
            await this.initializeContract();

            resolve(address);
          } catch (error) {
            console.error('Wallet connection error:', error);
            
            // Handle specific error types
            if (error.code === 4001) {
              reject(new Error('Connection was rejected. Please approve the connection in MetaMask.'));
            } else if (error.message.includes('Extension ID') || 
                       error.message.includes('runtime.sendMessage') ||
                       error.message.includes('chrome.runtime') ||
                       error.message.includes('chrome-extension://')) {
              reject(new Error('Browser extension conflict detected. Please try refreshing the page or temporarily disable other wallet extensions.'));
            } else if (error.message.includes('timeout')) {
              reject(new Error('Connection timeout. Please try again.'));
            } else {
              reject(new Error(`Connection failed: ${error.message}`));
            }
          }
        }, 100); // Small delay to avoid immediate conflicts
      });
    } catch (error) {
      throw error;
    }
  }

  async switchToSapphireTestnet() {
    try {
      // Use the provider we found earlier
      const walletProvider = this.provider?.provider || window.ethereum;
      
      if (!walletProvider) {
        console.warn('No wallet provider available for network switching');
        return;
      }
      
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SAPPHIRE_TESTNET_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        const walletProvider = this.provider?.provider || window.ethereum;
        
        if (!walletProvider) {
          console.warn('No wallet provider available for network addition');
          return;
        }
        
        await walletProvider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SAPPHIRE_TESTNET_CHAIN_ID.toString(16)}`,
            chainName: 'Oasis Sapphire Testnet',
            nativeCurrency: {
              name: 'ROSE',
              symbol: 'ROSE',
              decimals: 18,
            },
            rpcUrls: [SAPPHIRE_TESTNET_RPC],
            blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev'],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  async setContractAddress(address) {
    console.log('Setting contract address:', address);
    console.log('Signer available:', !!this.signer);
    
    if (!this.signer) {
      throw new Error('Signer not available. Please connect wallet first.');
    }
    
    this.contractAddress = address;
    this.contract = new Contract(address, CONTRACT_ABI, this.signer);
    console.log('Contract initialized:', !!this.contract);
    
    // Test if contract is deployed at this address
    try {
      const totalUsers = await this.contract.totalUsers();
      console.log('Contract test successful, total users:', totalUsers.toString());
    } catch (error) {
      console.error('Contract test failed:', error);
      throw new Error(`Contract not deployed at address ${address} or ABI mismatch`);
    }
  }

  async registerUser(name, age, bio, interests, monthlySalary) {
    console.log('registerUser called with:', { name, age, bio, interests, monthlySalary });
    console.log('Contract available:', !!this.contract);
    console.log('Contract address:', this.contractAddress);
    
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.registerUser(name, age, bio, interests, monthlySalary);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to register user:', error);
      throw error;
    }
  }

  async getUserProfile(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const profile = await this.contract.getUserProfile(address);
      return {
        name: profile[0],
        age: profile[1].toNumber(),
        bio: profile[2],
        interests: profile[3],
        monthlySalary: profile[4].toNumber(),
        isVerified: profile[5],
        isActive: profile[6],
        createdAt: profile[7].toNumber()
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  async getUserMatches(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const matches = await this.contract.getUserMatches(address);
      return matches;
    } catch (error) {
      console.error('Failed to get user matches:', error);
      throw error;
    }
  }

  async submitFlag(to, isRedFlag, review) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.submitFlag(to, isRedFlag, review);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to submit flag:', error);
      throw error;
    }
  }

  async approveFlag(from) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.approveFlag(from);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to approve flag:', error);
      throw error;
    }
  }

  async getVisibleFlags(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const flags = await this.contract.getVisibleFlags(address);
      return flags.map(flag => ({
        from: flag[0],
        to: flag[1],
        isRedFlag: flag[2],
        review: flag[3],
        encryptedReview: flag[4],
        timestamp: flag[5].toNumber(),
        isVisible: flag[6],
        flagId: flag[7],
        isEncrypted: flag[8]
      }));
    } catch (error) {
      console.error('Failed to get visible flags:', error);
      throw error;
    }
  }

  async getFlagStatistics(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const stats = await this.contract.getFlagStatistics(address);
      return {
        totalFlags: stats[0].toNumber(),
        redFlags: stats[1].toNumber(),
        greenFlags: stats[2].toNumber(),
        visibleFlags: stats[3].toNumber()
      };
    } catch (error) {
      console.error('Failed to get flag statistics:', error);
      throw error;
    }
  }

  async getVisibleRedFlags(address) {
    await this.ensureContractInitialized();

    try {
      const flags = await this.contract.getVisibleRedFlags(address);
      return flags.map(flag => ({
        from: flag[0],
        to: flag[1],
        isRedFlag: flag[2],
        review: flag[3],
        encryptedReview: flag[4],
        timestamp: flag[5].toNumber(),
        isVisible: flag[6],
        flagId: flag[7],
        isEncrypted: flag[8]
      }));
    } catch (error) {
      console.error('Failed to get visible red flags:', error);
      throw error;
    }
  }

  async getVisibleGreenFlags(address) {
    await this.ensureContractInitialized();

    try {
      const flags = await this.contract.getVisibleGreenFlags(address);
      return flags.map(flag => ({
        from: flag[0],
        to: flag[1],
        isRedFlag: flag[2],
        review: flag[3],
        encryptedReview: flag[4],
        timestamp: flag[5].toNumber(),
        isVisible: flag[6],
        flagId: flag[7],
        isEncrypted: flag[8]
      }));
    } catch (error) {
      console.error('Failed to get visible green flags:', error);
      throw error;
    }
  }

  async isRegistered(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.isRegistered(address);
    } catch (error) {
      console.error('Failed to check registration:', error);
      throw error;
    }
  }

  async updateProfile(bio, interests) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.updateProfile(bio, interests);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  async getCurrentAddress() {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return await this.signer.getAddress();
  }

  async disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
  }

  isContractInitialized() {
    return this.contract !== null && this.contractAddress !== null;
  }

  async ensureContractInitialized() {
    if (!this.isContractInitialized()) {
      if (!this.provider || !this.signer) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      await this.initializeContract();
    }
    
    if (!this.isContractInitialized()) {
      throw new Error('Contract not initialized. Please check your contract address configuration.');
    }
  }

  // Sapphire-specific privacy features

  async submitEncryptedFlag(to, isRedFlag, encryptedReview) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.submitEncryptedFlag(to, isRedFlag, encryptedReview);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to submit encrypted flag:', error);
      throw error;
    }
  }

  async submitAnonymousFlag(to, isRedFlag, review) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.submitAnonymousFlag(to, isRedFlag, review);
      const receipt = await tx.wait();
      
      // Extract the flag ID from the transaction result
      const flagId = receipt.logs.length > 0 ? receipt.logs[0].topics[1] : null;
      
      return {
        receipt,
        flagId
      };
    } catch (error) {
      console.error('Failed to submit anonymous flag:', error);
      throw error;
    }
  }

  async getFlagById(flagId, requester) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const flag = await this.contract.getFlagById(flagId, requester);
      return {
        from: flag[0],
        to: flag[1],
        isRedFlag: flag[2],
        review: flag[3],
        encryptedReview: flag[4],
        timestamp: flag[5].toNumber(),
        isVisible: flag[6],
        flagId: flag[7],
        isEncrypted: flag[8]
      };
    } catch (error) {
      console.error('Failed to get flag by ID:', error);
      throw error;
    }
  }

  async generateEncryptionSeed() {
    await this.ensureContractInitialized();

    try {
      return await this.contract.generateEncryptionSeed();
    } catch (error) {
      console.error('Failed to generate encryption seed:', error);
      throw error;
    }
  }

  async encryptFlagReview(review, key) {
    await this.ensureContractInitialized();

    try {
      return await this.contract.encryptFlagReview(review, key);
    } catch (error) {
      console.error('Failed to encrypt flag review:', error);
      throw error;
    }
  }

  // Utility function to encrypt review client-side before sending
  async encryptReviewForSubmission(review) {
    try {
      const seed = await this.generateEncryptionSeed();
      const encryptedReview = await this.encryptFlagReview(review, seed);
      return encryptedReview;
    } catch (error) {
      console.error('Failed to encrypt review for submission:', error);
      throw error;
    }
  }

  // Check if the current network supports Sapphire features
  async isSapphireNetwork() {
    if (!this.provider) {
      return false;
    }

    try {
      const network = await this.provider.getNetwork();
      return network.chainId === 23294 || network.chainId === 23295; // Mainnet or Testnet
    } catch (error) {
      console.error('Failed to check network:', error);
      return false;
    }
  }

  // ============ RATING SYSTEM METHODS ============

  /**
   * Get comprehensive user rating with category breakdowns
   */
  async getUserRating(userAddress) {
    await this.ensureContractInitialized();

    try {
      const rating = await this.contract.getUserRating(userAddress);
      return {
        overallScore: rating[0].toNumber(),
        safetyScore: rating[1].toNumber(),
        behaviorScore: rating[2].toNumber(),
        communicationScore: rating[3].toNumber(),
        kindnessScore: rating[4].toNumber(),
        reliabilityScore: rating[5].toNumber(),
        ratingTier: rating[6],
        totalInteractions: rating[7].toNumber(),
        positivePercentage: rating[8].toNumber(),
        isRecommended: rating[9]
      };
    } catch (error) {
      console.error('Failed to get user rating:', error);
      throw error;
    }
  }

  /**
   * Get category-specific statistics for a user
   */
  async getCategoryStats(userAddress, category) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const stats = await this.contract.getCategoryStats(userAddress, category);
      return {
        totalCount: stats[0].toNumber(),
        redCount: stats[1].toNumber(),
        greenCount: stats[2].toNumber(),
        averageSeverity: stats[3].toNumber(),
        categoryScore: stats[4].toNumber()
      };
    } catch (error) {
      console.error('Failed to get category stats:', error);
      throw error;
    }
  }

  /**
   * Get flag type distribution for analytics
   */
  async getFlagTypeDistribution(userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getFlagTypeDistribution(userAddress);
      const categories = result[0];
      const redCounts = result[1].map(count => count.toNumber());
      const greenCounts = result[2].map(count => count.toNumber());
      const categoryScores = result[3].map(score => score.toNumber());

      return {
        categories,
        redCounts,
        greenCounts,
        categoryScores
      };
    } catch (error) {
      console.error('Failed to get flag type distribution:', error);
      throw error;
    }
  }

  /**
   * Get all available flag categories
   */
  async getFlagCategories() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.getFlagCategories();
    } catch (error) {
      console.error('Failed to get flag categories:', error);
      throw error;
    }
  }

  /**
   * Get users by rating tier
   */
  async getUsersByRatingTier(tier) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.getUsersByRatingTier(tier);
    } catch (error) {
      console.error('Failed to get users by rating tier:', error);
      throw error;
    }
  }

  /**
   * Get recommended users for matching
   */
  async getRecommendedUsers() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.getRecommendedUsers();
    } catch (error) {
      console.error('Failed to get recommended users:', error);
      throw error;
    }
  }

  /**
   * Submit flag with new enhanced parameters
   */
  async submitFlagEnhanced(to, isRedFlag, review, category, severity = 0) {
    await this.ensureContractInitialized();

    try {
      const tx = await this.contract.submitFlag(to, isRedFlag, review, category, severity);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Extract flag ID from events if available
      let flagId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const flagEvent = receipt.logs.find(log => {
            try {
              const parsed = this.contract.interface.parseLog(log);
              return parsed.name === 'FlagSubmitted';
            } catch (e) {
              return false;
            }
          });
          
          if (flagEvent) {
            const parsedEvent = this.contract.interface.parseLog(flagEvent);
            flagId = parsedEvent.args.flagId;
          }
        } catch (e) {
          console.log('Could not parse flag ID from events');
        }
      }
      
      return {
        hash: tx.hash,
        receipt: receipt,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        transactionHash: receipt.transactionHash,
        flagId: flagId,
        success: true
      };
    } catch (error) {
      console.error('Failed to submit enhanced flag:', error);
      throw error;
    }
  }

  /**
   * Submit encrypted flag with new parameters
   */
  async submitEncryptedFlagEnhanced(to, isRedFlag, encryptedReview, category, severity = 0) {
    await this.ensureContractInitialized();

    try {
      const tx = await this.contract.submitEncryptedFlag(to, isRedFlag, encryptedReview, category, severity);
      console.log('Encrypted flag transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Encrypted flag transaction confirmed:', receipt);
      
      return {
        hash: tx.hash,
        receipt: receipt,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        transactionHash: receipt.transactionHash,
        success: true,
        type: 'encrypted'
      };
    } catch (error) {
      console.error('Failed to submit enhanced encrypted flag:', error);
      throw error;
    }
  }

  /**
   * Submit anonymous flag with new parameters
   */
  async submitAnonymousFlagEnhanced(to, isRedFlag, review, category, severity = 0) {
    await this.ensureContractInitialized();

    try {
      const tx = await this.contract.submitAnonymousFlag(to, isRedFlag, review, category, severity);
      console.log('Anonymous flag transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Anonymous flag transaction confirmed:', receipt);
      
      // Extract the flag ID from the transaction result
      let flagId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const flagEvent = receipt.logs.find(log => {
            try {
              const parsed = this.contract.interface.parseLog(log);
              return parsed.name === 'AnonymousFlagSubmitted';
            } catch (e) {
              return false;
            }
          });
          
          if (flagEvent) {
            const parsedEvent = this.contract.interface.parseLog(flagEvent);
            flagId = parsedEvent.args.flagId;
          }
        } catch (e) {
          console.log('Could not parse anonymous flag ID from events');
          flagId = receipt.logs[0].topics[1]; // Fallback
        }
      }
      
      return {
        hash: tx.hash,
        receipt: receipt,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        transactionHash: receipt.transactionHash,
        flagId: flagId,
        success: true,
        type: 'anonymous'
      };
    } catch (error) {
      console.error('Failed to submit enhanced anonymous flag:', error);
      throw error;
    }
  }

  /**
   * Get user reputation score
   */
  async getUserReputation(userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const reputation = await this.contract.userReputation(userAddress);
      return reputation.toNumber();
    } catch (error) {
      console.error('Failed to get user reputation:', error);
      throw error;
    }
  }

  /**
   * Check if category is valid
   */
  async isValidCategory(category) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.isValidCategory(category);
    } catch (error) {
      console.error('Failed to validate category:', error);
      throw error;
    }
  }

  // Manual detection method for debugging
  debugWalletDetection() {
    console.log('=== Rose Wallet Detection Debug ===');
    console.log('Window.rose:', window.rose);
    console.log('Window.ethereum:', window.ethereum);
    console.log('Ethereum.isRoseWallet:', window.ethereum?.isRoseWallet);
    console.log('Ethereum.isOasisWallet:', window.ethereum?.isOasisWallet);
    console.log('Ethereum.providers:', window.ethereum?.providers);
    
    if (window.ethereum?.providers) {
      window.ethereum.providers.forEach((provider, index) => {
        console.log(`Provider ${index}:`, {
          isRoseWallet: provider.isRoseWallet,
          isOasisWallet: provider.isOasisWallet,
          isMetaMask: provider.isMetaMask,
          name: provider.name || 'Unknown'
        });
      });
    }
    
    console.log('Detection result:', this.detectRoseWallet());
    console.log('=== End Debug ===');
  }
}

// Create a singleton instance
const oasisService = new OasisService();

export default oasisService; 