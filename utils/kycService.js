import { ethers } from 'ethers';

// Your actual contract ABI
const KYC_CONTRACT_ABI = [
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
        "internalType": "bool",
        "name": "isUpdate",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CredentialsSaved",
    "type": "event"
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
        "components": [
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "fullName",
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
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "interests",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "monthlySalaryCents",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "dateOfBirth",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "documentType",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "documentNumber",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "profileImageHash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "idDocumentHash",
            "type": "string"
          }
        ],
        "internalType": "struct SimpleKYCProfile.InputProfile",
        "name": "input",
        "type": "tuple"
      }
    ],
    "name": "saveCredentials",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class KYCService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = '0x5936baC9550F03Ca6a57E2098Ab0Ce0447263ff6';
  }

  // Connect to MetaMask wallet
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

      // Check if we're on the correct network
      await this.switchToSapphireTestnet();

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Initialize contract
      this.contract = new ethers.Contract(
        this.contractAddress, 
        KYC_CONTRACT_ABI, 
        this.signer
      );

      const address = await this.signer.getAddress();
      return address;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  // Get contract address
  getContractAddress() {
    return this.contractAddress;
  }

  // Save credentials to blockchain
  async saveCredentials(profileData) {
    try {
      // Ensure wallet is connected
      if (!this.contract || !this.signer) {
        console.log('Contract not initialized, attempting to reconnect...');
        await this.connectWallet();
      }

      if (!this.contract) {
        throw new Error('Failed to initialize contract. Please ensure MetaMask is connected.');
      }

      console.log('Saving credentials to blockchain...');
      console.log('Profile data:', profileData);

      // Validate required fields
      const validationErrors = this.validateProfileData(profileData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Prepare the input struct according to your contract
      const inputProfile = {
        username: profileData.username || '',
        fullName: profileData.fullName || '',
        age: profileData.age || 0,
        gender: profileData.gender || '',
        bio: profileData.bio || '',
        interests: profileData.interests || '',
        monthlySalaryCents: profileData.monthlySalaryCents || 0,
        dateOfBirth: profileData.dateOfBirth || '',
        documentType: profileData.documentType || '',
        documentNumber: profileData.documentNumber || '',
        profileImageHash: profileData.profileImageHash || '',
        idDocumentHash: profileData.idDocumentHash || ''
      };

      // Check if user is already registered
      const userAddress = await this.signer.getAddress();
      const isAlreadyRegistered = await this.isRegistered(userAddress);

      // Estimate gas first
      let gasEstimate;
      try {
        gasEstimate = await this.contract.saveCredentials.estimateGas(inputProfile);
      } catch (gasError) {
        // Use a reasonable default gas limit if estimation fails
        gasEstimate = 500000n;
      }

      // Call the contract function with gas limit buffer
      const tx = await this.contract.saveCredentials(inputProfile, {
        gasLimit: gasEstimate * 130n / 100n // Add 30% buffer
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Parse events to get more information
      const events = receipt.logs.map(log => {
        try {
          return this.contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        contractAddress: this.contractAddress,
        explorerUrl: `https://testnet.explorer.sapphire.oasis.dev/tx/${receipt.hash}`,
        events: events,
        isUpdate: isAlreadyRegistered
      };
    } catch (error) {
      console.error('Failed to save credentials:', error);
      
      // Handle specific error cases
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error('Transaction simulation failed. Please check your input data and try again.');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient ROSE tokens to pay for gas. Please add ROSE to your wallet from a faucet.');
      } else if (error.message.includes('user rejected') || error.code === 4001) {
        throw new Error('Transaction cancelled by user.');
      } else if (error.message.includes('network')) {
        throw new Error('Network error. Please check your connection to Oasis Sapphire Testnet.');
      } else if (error.message.includes('nonce')) {
        throw new Error('Transaction nonce error. Please reset your MetaMask account or try again.');
      }
      
      // Re-throw with more context
      throw new Error(`Contract interaction failed: ${error.message}`);
    }
  }

  // Check if user is registered
  async isRegistered(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const registered = await this.contract.isRegistered(address);
      return registered;
    } catch (error) {
      // Return false instead of throwing to allow graceful fallback
      return false;
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
      console.log('Switched to Oasis Sapphire Testnet');
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [sapphireTestnet],
          });
          console.log('Added and switched to Oasis Sapphire Testnet');
        } catch (addError) {
          console.error('Failed to add Oasis Sapphire Testnet:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch to Oasis Sapphire Testnet:', switchError);
        throw switchError;
      }
    }
  }

  // Get current network
  async getCurrentNetwork() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const network = await this.provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name
      };
    } catch (error) {
      console.error('Failed to get current network:', error);
      throw error;
    }
  }

  // Get wallet balance
  async getBalance(address) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  // Listen for CredentialsSaved events
  listenForCredentialsSaved(callback) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    this.contract.on('CredentialsSaved', (user, isUpdate, timestamp, event) => {
      console.log('CredentialsSaved event:', {
        user,
        isUpdate,
        timestamp: Number(timestamp),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
      
      if (callback) {
        callback({
          user,
          isUpdate,
          timestamp: Number(timestamp),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }
    });
  }

  // Stop listening for events
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }

  // Utility function to format addresses
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Utility function to format timestamps
  formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  // Utility function to format ROSE amounts
  formatROSE(amount) {
    return `${parseFloat(amount).toFixed(4)} ROSE`;
  }

  // Check if wallet is connected
  isWalletConnected() {
    return this.signer !== null && this.contract !== null;
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      throw error;
    }
  }

  // Wait for transaction confirmation with timeout
  async waitForTransaction(txHash, timeout = 60000) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.waitForTransaction(txHash, 1, timeout);
    } catch (error) {
      console.error('Transaction confirmation timeout or failed:', error);
      throw error;
    }
  }

  // Validate profile data before submission
  validateProfileData(profileData) {
    const errors = [];

    if (!profileData.username || profileData.username.trim().length === 0) {
      errors.push('Username is required');
    }

    if (!profileData.fullName || profileData.fullName.trim().length === 0) {
      errors.push('Full name is required');
    }

    if (!profileData.age || profileData.age < 18 || profileData.age > 100) {
      errors.push('Age must be between 18 and 100');
    }

    if (!profileData.gender || profileData.gender.trim().length === 0) {
      errors.push('Gender is required');
    }

    if (!profileData.bio || profileData.bio.trim().length === 0) {
      errors.push('Bio is required');
    }

    if (!profileData.dateOfBirth || profileData.dateOfBirth.trim().length === 0) {
      errors.push('Date of birth is required');
    }

    if (!profileData.documentType || profileData.documentType.trim().length === 0) {
      errors.push('Document type is required');
    }

    if (!profileData.documentNumber || profileData.documentNumber.trim().length === 0) {
      errors.push('Document number is required');
    }

    if (profileData.monthlySalaryCents < 0) {
      errors.push('Monthly salary cannot be negative');
    }

    return errors;
  }

  // Get contract information
  getContractInfo() {
    return {
      address: this.contractAddress,
      network: 'Oasis Sapphire Testnet',
      explorer: `https://testnet.explorer.sapphire.oasis.dev/address/${this.contractAddress}`,
      isConnected: this.isWalletConnected()
    };
  }
}

// Create and export singleton instance
const kycService = new KYCService();
export default kycService;