#!/bin/bash

# Configuration script for real KYCProfile contract
# Run this after deploying the contract

echo "🚀 Configuring Real KYCProfile Contract"
echo "======================================"

# Check if contract address is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide the deployed contract address"
    echo "Usage: ./configure-real-contract.sh <contract_address>"
    echo "Example: ./configure-real-contract.sh 0x1234567890abcdef1234567890abcdef12345678"
    exit 1
fi

CONTRACT_ADDRESS=$1
echo "📝 Contract Address: $CONTRACT_ADDRESS"

# Update frontend environment
echo "🔧 Updating frontend environment (.env.local)..."
if grep -q "NEXT_PUBLIC_KYC_CONTRACT_ADDRESS" .env.local 2>/dev/null; then
    sed -i.bak "s/NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=.*/NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env.local
else
    echo "NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env.local
fi

# Update backend environment
echo "🔧 Updating backend environment (backend/.env)..."
sed -i.bak "s/KYC_CONTRACT_ADDRESS=.*/KYC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" backend/.env

# Check if private key is set in backend
if grep -q "BACKEND_PRIVATE_KEY=your_private_key_here" backend/.env; then
    echo "⚠️  Warning: Please update BACKEND_PRIVATE_KEY in backend/.env with your actual private key"
fi

# Update encryption password if needed
if grep -q "ENCRYPTION_PASSWORD=your_secure_encryption_password_here" backend/.env; then
    echo "⚠️  Warning: Please update ENCRYPTION_PASSWORD in backend/.env with a secure password"
fi

echo "✅ Configuration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your private key and encryption password"
echo "2. Restart the backend: cd backend && npm start"
echo "3. Restart the frontend: npm run dev"
echo "4. Test real blockchain transactions!"
echo ""
echo "🎉 Your app will now use REAL blockchain transactions on Oasis Sapphire!" 