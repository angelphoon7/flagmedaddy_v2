const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying DatingApp with Privacy Features to Oasis Sapphire...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ROSE");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance. You might need more ROSE tokens for deployment.");
  }
  
  console.log("\n🔨 Compiling contracts...");
  
  try {
    // Deploy DatingApp contract
    console.log("📦 Deploying DatingApp contract...");
    const DatingApp = await ethers.getContractFactory("DatingApp");
    
    // Deploy with higher gas limit for Sapphire
    const datingApp = await DatingApp.deploy({
      gasLimit: 5000000, // 5M gas limit
      gasPrice: ethers.parseUnits("100", "gwei") // 100 gwei
    });
    
    await datingApp.waitForDeployment();
    const datingAppAddress = await datingApp.getAddress();
    
    console.log("✅ DatingApp deployed to:", datingAppAddress);
    
    // Verify deployment by calling a simple function
    console.log("\n🔍 Verifying deployment...");
    const totalUsers = await datingApp.totalUsers();
    console.log("📊 Total users (should be 0):", totalUsers.toString());
    
    // Test Sapphire-specific features
    console.log("\n🔐 Testing Sapphire privacy features...");
    
    try {
      const encryptionSeed = await datingApp.generateEncryptionSeed();
      console.log("🎲 Generated encryption seed:", encryptionSeed);
      console.log("✅ Sapphire random generation working!");
    } catch (error) {
      console.log("⚠️  Sapphire random generation test failed:", error.message);
    }
    
    // Save deployment information
    const deploymentInfo = {
      network: "sapphire",
      chainId: await deployer.provider.getNetwork().then(n => n.chainId),
      datingAppAddress: datingAppAddress,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      gasUsed: {
        datingApp: "~5M gas"
      },
      sapphireFeatures: {
        privacyEnabled: true,
        encryptedFlags: true,
        anonymousFlags: true,
        secureRandom: true
      }
    };
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info
    const deploymentFile = path.join(deploymentsDir, 'sapphire-deployment.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📄 Deployment information saved to:", deploymentFile);
    
    // Create .env update suggestions
    console.log("\n🔧 Add these to your .env file:");
    console.log(`NEXT_PUBLIC_DATING_CONTRACT_ADDRESS=${datingAppAddress}`);
    console.log(`NEXT_PUBLIC_SAPPHIRE_NETWORK=testnet`);
    console.log(`NEXT_PUBLIC_PRIVACY_ENABLED=true`);
    
    // Display contract interaction examples
    console.log("\n📋 Contract Interaction Examples:");
    console.log("=".repeat(50));
    
    console.log("\n🏷️  Register User:");
    console.log(`await datingApp.registerUser("Alice", 25, "Love hiking", ["hiking", "coffee"], 5000);`);
    
    console.log("\n🚩 Submit Regular Flag:");
    console.log(`await datingApp.submitFlag(userAddress, false, "Great conversation!");`);
    
    console.log("\n🔐 Submit Encrypted Flag:");
    console.log(`await datingApp.submitEncryptedFlag(userAddress, true, encryptedReview);`);
    
    console.log("\n👤 Submit Anonymous Flag:");
    console.log(`const flagId = await datingApp.submitAnonymousFlag(userAddress, false, "Very kind person");`);
    
    console.log("\n📊 Get Flag Statistics:");
    console.log(`const stats = await datingApp.getFlagStatistics(userAddress);`);
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("🔗 Sapphire Testnet Explorer:", `https://testnet.explorer.sapphire.oasis.dev/address/${datingAppAddress}`);
    
    return {
      datingApp: datingAppAddress,
      deployer: deployer.address
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Add more ROSE tokens to your wallet");
      console.log("🔗 Sapphire Testnet Faucet: https://faucet.testnet.oasis.dev/");
    } else if (error.message.includes("gas")) {
      console.log("\n💡 Solution: Try increasing gas limit or gas price");
    }
    
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = main;
