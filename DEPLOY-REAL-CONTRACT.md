# 🚀 Deploy Real KYCProfile Contract

This guide will help you deploy the real KYCProfile smart contract to Oasis Sapphire and configure your app to use REAL blockchain transactions.

## 📋 Prerequisites

1. **MetaMask Wallet** with Oasis Sapphire Testnet configured
2. **ROSE tokens** for gas fees (get from [Oasis Faucet](https://faucet.testnet.oasis.dev/))
3. **Your wallet private key** (export from MetaMask)

## 🔑 Step 1: Get Your Private Key

1. Open MetaMask extension
2. Click the 3 dots menu → **Account details**
3. Click **Export Private Key**
4. Enter your MetaMask password
5. Copy the private key (starts with `0x...`)

⚠️ **SECURITY WARNING**: Never share your private key or commit it to Git!

## 🚀 Step 2: Deploy the Contract

```bash
# 1. Add your private key to .env file
echo "PRIVATE_KEY=0xyour_actual_private_key_here" > .env

# 2. Deploy KYCProfile contract to Oasis Sapphire
npx hardhat run scripts/deploy-kyc.js --network sapphireTestnet
```

The deployment will output something like:
```
Deploying KYCProfile contract to Oasis Sapphire...
Deploying contracts with the account: 0x1234567890abcdef...
KYCProfile contract deployed to: 0xabcdef1234567890abcdef1234567890abcdef12
```

## ⚙️ Step 3: Configure Your App

Use the configuration script with your deployed contract address:

```bash
# Replace with your actual deployed contract address
./configure-real-contract.sh 0xabcdef1234567890abcdef1234567890abcdef12
```

## 🔧 Step 4: Manual Configuration

If the script doesn't work, manually update these files:

### Frontend (.env.local)
```bash
NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
NEXT_PUBLIC_KYC_BACKEND_URL=http://localhost:3001
```

### Backend (backend/.env)
```bash
KYC_CONTRACT_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
BACKEND_PRIVATE_KEY=0xyour_actual_private_key_here
ENCRYPTION_PASSWORD=your_secure_encryption_password_here
```

## 🔄 Step 5: Restart Services

```bash
# 1. Restart backend
cd backend
npm start

# 2. In another terminal, restart frontend  
cd ..
npm run dev
```

## ✅ Step 6: Verify Real Mode

Check the backend console logs. You should see:
```
🚀 REAL BLOCKCHAIN MODE ENABLED!
   Contract Address: 0xabcdef1234567890abcdef1234567890abcdef12
   Network: Oasis Sapphire Testnet
   All transactions will be REAL blockchain transactions!
```

If you see `🎭 MOCK MODE ENABLED`, check your configuration.

## 🎉 Step 7: Test Real Transactions

1. **Connect Wallet** in the app
2. **Complete KYC Registration** 
3. **Check Transaction Details** - You'll see real transaction hashes!
4. **View Transaction History** - Click the ⛓️ Transactions button

## 🔍 Verify on Blockchain

You can verify your transactions on the Oasis Sapphire explorer:
- **Testnet Explorer**: https://testnet.explorer.sapphire.oasis.dev/
- Search for your contract address or transaction hashes

## 🛡️ Privacy Features

Your KYCProfile contract on Oasis Sapphire provides:

- **🔒 Encrypted Storage**: All sensitive data encrypted at runtime
- **👥 Access Control**: Only authorized parties can view private data  
- **🆔 KYC Verification**: Blockchain-verified identity
- **📊 Public Profiles**: Safe public data for discovery
- **⚡ Fast Transactions**: Optimized for dating app use cases

## 🆘 Troubleshooting

### Mock Mode Still Enabled?
- Check contract address is correct in both `.env.local` and `backend/.env`
- Verify private key is set in `backend/.env`
- Restart both frontend and backend services

### Deployment Failed?
- Ensure you have ROSE tokens in your wallet
- Check your private key is correct (starts with `0x`)
- Verify Oasis Sapphire Testnet is configured in MetaMask

### Transactions Failing?
- Check you have enough ROSE for gas fees
- Verify contract address is correct
- Check backend logs for detailed error messages

## 🎯 Success!

Once configured, your Flag Me Daddy app will use REAL blockchain transactions on Oasis Sapphire! 

Every profile creation, KYC verification, and data access will be a real transaction on the blockchain, providing true decentralization and privacy for your dating app users.

🎉 **Welcome to the future of decentralized dating!** 💕 