# 🚀 Oasis Sapphire Flag System Deployment Guide

## 🎯 Overview

Your **Green Flag and Red Flag system** is now enhanced with **Oasis Sapphire privacy features**! This guide will help you deploy it to the Sapphire testnet.

## 🔧 Enhanced Features Added

### 🔐 **Privacy Features**
- **Encrypted Flags**: Reviews can be encrypted using Sapphire's privacy capabilities
- **Anonymous Flags**: Submit flags without revealing your identity until approval
- **Secure Random**: Uses Sapphire's cryptographically secure random number generation
- **Privacy Controls**: Enhanced access control for sensitive flag data

### 📋 **New Smart Contract Functions**

```solidity
// Regular flag submission (existing)
function submitFlag(address to, bool isRedFlag, string review)

// NEW: Submit encrypted flag for enhanced privacy
function submitEncryptedFlag(address to, bool isRedFlag, bytes encryptedReview)

// NEW: Submit anonymous flag (hides sender until approval)
function submitAnonymousFlag(address to, bool isRedFlag, string review) returns (bytes32 flagId)

// NEW: Get flag by unique ID with privacy controls
function getFlagById(bytes32 flagId, address requester) returns (Flag)

// NEW: Generate secure encryption seed
function generateEncryptionSeed() returns (bytes32)

// NEW: Encrypt flag review data
function encryptFlagReview(string review, bytes32 key) returns (bytes)
```

## 🛠️ Deployment Steps

### 1. **Setup Environment**

Create a `.env` file in your project root:

```bash
# Oasis Sapphire Configuration
NEXT_PUBLIC_SAPPHIRE_RPC=https://testnet.sapphire.oasis.dev
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address_here

# Hardhat Configuration (for deployment)
PRIVATE_KEY=your_wallet_private_key_here

# Optional: Mainnet Configuration
# NEXT_PUBLIC_SAPPHIRE_MAINNET_RPC=https://sapphire.oasis.dev
```

### 2. **Get Testnet Funds**

1. Go to the [Oasis Sapphire Testnet Faucet](https://faucet.testnet.oasis.dev/)
2. Enter your wallet address
3. Request testnet ROSE tokens
4. Wait for confirmation

### 3. **Deploy the Contract**

Run the deployment script:

```bash
npx hardhat run scripts/deploy-sapphire-dating.js --network sapphireTestnet
```

### 4. **Verify Deployment**

The script will output:
- Contract address
- Deployment transaction hash
- Links to Sapphire explorer
- Environment variable suggestions

## 🔍 Contract Structure

### **Enhanced Flag Struct**

```solidity
struct Flag {
    address from;              // Flag sender
    address to;               // Flag recipient  
    bool isRedFlag;           // true = red flag, false = green flag
    string review;            // Plain text review
    bytes encryptedReview;    // Encrypted version for privacy
    uint256 timestamp;        // When flag was created
    bool isVisible;          // Whether flag is approved/visible
    bytes32 flagId;          // Unique identifier
    bool isEncrypted;        // Whether review is encrypted
}
```

## 🎮 Usage Examples

### **Frontend Integration**

```javascript
import oasisService from './utils/oasis';

// Submit regular flag
await oasisService.submitFlag(userAddress, false, "Great conversation!");

// Submit encrypted flag
const encryptedReview = await oasisService.encryptReviewForSubmission("Sensitive feedback");
await oasisService.submitEncryptedFlag(userAddress, true, encryptedReview);

// Submit anonymous flag
const result = await oasisService.submitAnonymousFlag(userAddress, false, "Kind person");
console.log("Anonymous flag ID:", result.flagId);

// Check if on Sapphire network
const isSapphire = await oasisService.isSapphireNetwork();
if (isSapphire) {
    console.log("Privacy features enabled!");
}
```

### **Privacy-Aware Flag Display**

```javascript
// Get flags with privacy handling
const flags = await oasisService.getVisibleFlags(userAddress);

flags.forEach(flag => {
    if (flag.isEncrypted && flag.encryptedReview) {
        console.log("🔐 Encrypted flag detected");
        // Handle encrypted content
    } else {
        console.log("📝 Regular flag:", flag.review);
    }
});
```

## 🔒 Privacy Features Explained

### **1. Encrypted Flags**
- Reviews are encrypted using Sapphire's privacy capabilities
- Only authorized parties can decrypt the content
- Metadata (flag type, timestamp) remains visible

### **2. Anonymous Flags** 
- Sender identity is hidden until the recipient approves the flag
- Uses cryptographic techniques to maintain anonymity
- Prevents retaliation while maintaining accountability

### **3. Secure Random Generation**
- Uses Sapphire's cryptographically secure random number generator
- Generates unique flag IDs and encryption seeds
- Prevents predictable patterns or manipulation

## 📊 Network Information

### **Sapphire Testnet**
- **RPC URL**: `https://testnet.sapphire.oasis.dev`
- **Chain ID**: `23295` (0x5aff)
- **Currency**: ROSE
- **Explorer**: https://testnet.explorer.sapphire.oasis.dev
- **Faucet**: https://faucet.testnet.oasis.dev

### **Sapphire Mainnet**
- **RPC URL**: `https://sapphire.oasis.dev`
- **Chain ID**: `23294` (0x5afe)
- **Currency**: ROSE
- **Explorer**: https://explorer.sapphire.oasis.dev

## 🧪 Testing

Run the enhanced test suite:

```bash
# Run all flag system tests
npx hardhat test test/flag-system-test.js

# Test specific privacy features
npx hardhat test test/sapphire-privacy-test.js
```

## 📱 Frontend Updates

The enhanced `oasis.js` service now includes:

- `submitEncryptedFlag()` - Submit encrypted flags
- `submitAnonymousFlag()` - Submit anonymous flags  
- `getFlagById()` - Get flag by unique ID
- `generateEncryptionSeed()` - Generate encryption keys
- `encryptReviewForSubmission()` - Client-side encryption
- `isSapphireNetwork()` - Check network compatibility

## 🔐 Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Encryption**: Encrypted data is only as secure as key management
3. **Anonymous Flags**: Anonymity is maintained until approval
4. **Gas Costs**: Privacy features may require slightly more gas

## 🎉 What's Next?

1. **Deploy** the contract using the guide above
2. **Update** your frontend to use the new privacy features
3. **Test** the encrypted and anonymous flag functionality
4. **Monitor** your deployment on the Sapphire explorer

## 📞 Support

- **Oasis Documentation**: https://docs.oasis.io/
- **Sapphire Developer Guide**: https://docs.oasis.io/sapphire/
- **Community Discord**: https://oasis.io/discord

---

Your flag system is now **privacy-enhanced** and ready for **Oasis Sapphire**! 🚀
