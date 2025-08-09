# 🚀 KYC System Setup Guide

## ⚠️ Quick Fix for "Contract not initialized" Error

The error occurs because the KYC smart contract hasn't been deployed yet. Follow these steps:

### **Step 1: Get Your Private Key**
1. Open MetaMask extension
2. Click on your account name → Account Details
3. Click "Export Private Key"
4. Enter your MetaMask password
5. Copy the private key (without the 0x prefix)

### **Step 2: Add Private Key to Environment**
```bash
# Edit the .env file and add your private key:
echo "PRIVATE_KEY=your_actual_private_key_here" >> .env
```

### **Step 3: Deploy the KYC Contract**
```bash
# Compile and deploy the contract
npx hardhat compile
npx hardhat run scripts/deploy-kyc.js --network sapphireTestnet
```

### **Step 4: Update Environment with Contract Address**
After deployment, you'll see output like:
```
KYCProfile contract deployed to: 0x1234567890123456789012345678901234567890
```

Add this address to your environment:
```bash
echo "NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890" >> .env.local
```

### **Step 5: Set Up Backend (Optional)**
For full KYC functionality, set up the backend:
```bash
cd backend
cp env.example .env
# Edit backend/.env and add:
# KYC_CONTRACT_ADDRESS=your_contract_address
# BACKEND_PRIVATE_KEY=your_private_key

npm start
```

### **Step 6: Test the System**
```bash
# Start the frontend
npm run dev
```

## 🔧 **Alternative: Quick Test Mode**

If you want to test immediately without deploying, I can create a mock mode that simulates the KYC flow without blockchain interaction.

## 📋 **What You Get:**

✅ **Privacy-First KYC**: ID verification with Oasis Sapphire encryption  
✅ **3-Step Profile Creation**: Profile → KYC → Document Upload  
✅ **Secure File Handling**: Encrypted document storage  
✅ **Mock KYC Provider**: Ready for testing  
✅ **Real KYC Integration**: Ready for Jumio/Onfido  

## 🆘 **Need Help?**

If you encounter any issues:
1. Make sure you have ROSE tokens in your wallet for gas fees
2. Ensure MetaMask is connected to Oasis Sapphire Testnet
3. Check that all environment variables are set correctly

Let me know if you need help with any of these steps! 