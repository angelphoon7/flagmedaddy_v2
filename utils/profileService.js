import { ethers } from 'ethers';

const PROFILE_CONTRACT_ABI = [
  'function createProfile(string memory _name, uint256 _age, string memory _gender, string memory _bio, string[] memory _interests, uint256 _monthlySalary, string memory _profileImageHash, string memory _payslipHash) public',
  'function updateProfile(string memory _bio, string[] memory _interests, string memory _profileImageHash) public',
  'function getProfile(address _user) public view returns (string memory name, uint256 age, string memory gender, string memory bio, string[] memory interests, uint256 monthlySalary, string memory profileImageHash, string memory payslipHash, bool isVerified, bool isActive, uint256 createdAt, address userAddress)',
  'function getMyProfile() public view returns (string memory name, uint256 age, string memory gender, string memory bio, string[] memory interests, uint256 monthlySalary, string memory profileImageHash, string memory payslipHash, bool isVerified, bool isActive, uint256 createdAt, address userAddress)',
  'function checkRegistration(address _user) public view returns (bool)',
  'function getTotalUsers() public view returns (uint256)',
  'function getUsers(uint256 _start, uint256 _limit) public view returns (address[] memory)',
  'function getActiveUsers(uint256 _start, uint256 _limit) public view returns (address[] memory)',
  'function verifyProfile(address _user) public',
  'function deactivateProfile() public',
  'function reactivateProfile() public',
  'event ProfileCreated(address indexed user, string name, uint256 timestamp)',
  'event ProfileUpdated(address indexed user, uint256 timestamp)',
  'event ProfileVerified(address indexed user, uint256 timestamp)'
];

class ProfileService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
  }

  // Connect to MetaMask and initialize contract
  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask extension.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.');
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      const address = await this.signer.getAddress();
      console.log('Connected to wallet:', address);

      return address;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  // Set contract address and initialize contract
  setContractAddress(address) {
    this.contractAddress = address;
    if (this.signer) {
      this.contract = new ethers.Contract(address, PROFILE_CONTRACT_ABI, this.signer);
      console.log('Profile contract initialized at:', address);
    } else {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }
  }

  // Upload file to IPFS (mock implementation - replace with actual IPFS service)
  async uploadToIPFS(file) {
    // This is a mock implementation
    // In a real app, you would upload to IPFS and return the hash
    console.log('Mock IPFS upload for file:', file.name);
    
    // Generate a mock hash based on file name and timestamp
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
    console.log('Mock IPFS hash generated:', mockHash);
    
    return mockHash;
  }

  // Create user profile on blockchain
  async createProfile(profileData) {
    if (!this.contract) {
      throw new Error('Contract not initialized. Please set contract address first.');
    }

    try {
      console.log('Creating profile on blockchain:', profileData);

      // Upload files to IPFS (mock)
      let profileImageHash = '';
      let payslipHash = '';

      if (profileData.profileImage) {
        profileImageHash = await this.uploadToIPFS(profileData.profileImage);
      }

      if (profileData.payslip) {
        payslipHash = await this.uploadToIPFS(profileData.payslip);
      }

      // Convert salary to cents to avoid decimal issues
      const salaryInCents = Math.floor(profileData.monthlySalary * 100);

      // Call smart contract
      const tx = await this.contract.createProfile(
        profileData.name,
        profileData.age,
        profileData.gender,
        profileData.bio,
        profileData.interests,
        salaryInCents,
        profileImageHash,
        payslipHash
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return receipt;
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  }

  // Get user profile from blockchain
  async getProfile(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const profile = await this.contract.getProfile(address);
      
      return {
        name: profile[0],
        age: Number(profile[1]),
        gender: profile[2],
        bio: profile[3],
        interests: profile[4],
        monthlySalary: Number(profile[5]) / 100, // Convert back from cents
        profileImageHash: profile[6],
        payslipHash: profile[7],
        isVerified: profile[8],
        isActive: profile[9],
        createdAt: Number(profile[10]),
        userAddress: profile[11]
      };
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  // Get current user's profile
  async getMyProfile() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const profile = await this.contract.getMyProfile();
      
      return {
        name: profile[0],
        age: Number(profile[1]),
        gender: profile[2],
        bio: profile[3],
        interests: profile[4],
        monthlySalary: Number(profile[5]) / 100, // Convert back from cents
        profileImageHash: profile[6],
        payslipHash: profile[7],
        isVerified: profile[8],
        isActive: profile[9],
        createdAt: Number(profile[10]),
        userAddress: profile[11]
      };
    } catch (error) {
      console.error('Failed to get my profile:', error);
      throw error;
    }
  }

  // Check if user is registered
  async isRegistered(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.checkRegistration(address);
    } catch (error) {
      console.error('Failed to check registration:', error);
      return false;
    }
  }

  // Get total number of users
  async getTotalUsers() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const total = await this.contract.getTotalUsers();
      return Number(total);
    } catch (error) {
      console.error('Failed to get total users:', error);
      return 0;
    }
  }

  // Get users for discovery (paginated)
  async getUsers(start = 0, limit = 10) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const userAddresses = await this.contract.getUsers(start, limit);
      
      // Get profiles for each user
      const profiles = [];
      for (const address of userAddresses) {
        try {
          const profile = await this.getProfile(address);
          profiles.push(profile);
        } catch (error) {
          console.error(`Failed to get profile for ${address}:`, error);
        }
      }
      
      return profiles;
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  // Get active users only
  async getActiveUsers(start = 0, limit = 10) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const userAddresses = await this.contract.getActiveUsers(start, limit);
      
      // Get profiles for each user
      const profiles = [];
      for (const address of userAddresses) {
        try {
          const profile = await this.getProfile(address);
          profiles.push(profile);
        } catch (error) {
          console.error(`Failed to get profile for ${address}:`, error);
        }
      }
      
      return profiles;
    } catch (error) {
      console.error('Failed to get active users:', error);
      return [];
    }
  }

  // Update profile
  async updateProfile(bio, interests, profileImage) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      let profileImageHash = '';
      if (profileImage) {
        profileImageHash = await this.uploadToIPFS(profileImage);
      }

      const tx = await this.contract.updateProfile(bio, interests, profileImageHash);
      const receipt = await tx.wait();
      
      return receipt;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // Switch to Oasis Sapphire Testnet
  async switchToSapphireTestnet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const sapphireTestnet = {
      chainId: '0x5AFF', // 23295 in hex
      chainName: 'Oasis Sapphire Testnet',
      nativeCurrency: {
        name: 'ROSE',
        symbol: 'ROSE',
        decimals: 18,
      },
      rpcUrls: ['https://testnet.sapphire.oasis.dev'],
      blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev'],
    };

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sapphireTestnet.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [sapphireTestnet],
          });
        } catch (addError) {
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }
}

// Create and export a singleton instance
const profileService = new ProfileService();
export default profileService; 