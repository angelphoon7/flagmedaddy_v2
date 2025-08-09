require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  console.log("🚀 Deploying KYC Profile Self-Service Contract to Oasis Sapphire...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ROSE");

  if (balance === 0n) {
    console.log("❌ Insufficient balance. Please fund your account with testnet ROSE tokens.");
    console.log("🔗 Get testnet tokens: https://faucet.testnet.oasis.dev/");
    process.exit(1);
  }

  try {
    // Deploy KYC Profile Self-Service contract
    console.log("\n📋 Deploying KYCProfileSelfService contract...");
    const KYCProfileSelfService = await ethers.getContractFactory("KYCProfileSelfService");
    
    const kycProfile = await KYCProfileSelfService.deploy({
      gasLimit: 3000000 // Set gas limit for deployment
    });

    await kycProfile.waitForDeployment();
    const kycProfileAddress = await kycProfile.getAddress();

    console.log("✅ KYCProfileSelfService deployed to:", kycProfileAddress);

    // Verify the deployment
    console.log("\n🔍 Verifying deployment...");
    const owner = await kycProfile.owner();
    console.log("📋 Contract owner:", owner);
    console.log("✅ Owner matches deployer:", owner === deployer.address);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    const totalUsers = await kycProfile.getTotalUsers();
    console.log("📊 Total users (should be 0):", totalUsers.toString());

    // Display deployment summary
    console.log("\n🎉 Deployment Complete!");
    console.log("=====================================");
    console.log("📋 KYC Profile Self-Service Contract:", kycProfileAddress);
    console.log("👤 Owner:", owner);
    console.log("🔗 Explorer:", `https://testnet.explorer.sapphire.oasis.dev/address/${kycProfileAddress}`);
    console.log("=====================================");

    // Update environment variables instructions
    console.log("\n📝 Next Steps:");
    console.log("1. Add this to your .env file:");
    console.log(`   NEXT_PUBLIC_KYC_PROFILE_CONTRACT_ADDRESS=${kycProfileAddress}`);
    console.log("");
    console.log("2. Update your frontend to use the new contract address");
    console.log("");
    console.log("3. Test the contract with:");
    console.log(`   node scripts/test-kyc-self-service.js`);
    console.log("");
    console.log("4. Key features of this contract:");
    console.log("   ✅ Users can create their own profiles (no authorization needed)");
    console.log("   ✅ Users can submit KYC documents for verification");
    console.log("   ✅ Auto-verification for demo purposes (can be disabled for production)");
    console.log("   ✅ Privacy protection with Oasis Sapphire");

    // Return deployment info
    return {
      kycProfileAddress,
      owner,
      deployer: deployer.address
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
