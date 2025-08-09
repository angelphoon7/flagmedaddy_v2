const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚩 Deploying Flag Smart Contract to Oasis Sapphire...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ROSE");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance. You might need more ROSE tokens.");
    console.log("🔗 Get testnet ROSE: https://faucet.testnet.oasis.dev/");
  }
  
  console.log("\n🔨 Compiling Flag contract...");
  
  try {
    // Deploy Flag contract
    console.log("📦 Deploying Flag contract...");
    const Flag = await ethers.getContractFactory("Flag");
    
    // Deploy with optimized gas settings for Sapphire
    const flag = await Flag.deploy({
      gasLimit: 6000000, // 6M gas limit for the complex contract
      gasPrice: ethers.parseUnits("100", "gwei")
    });
    
    await flag.waitForDeployment();
    const flagAddress = await flag.getAddress();
    
    console.log("✅ Flag contract deployed to:", flagAddress);
    
    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const totalFlags = await flag.totalFlagsSubmitted();
    console.log("📊 Total flags submitted:", totalFlags.toString());
    
    const categories = await flag.getFlagCategories();
    console.log("📋 Available categories:", categories.length);
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat}`);
    });
    
    // Test Sapphire features
    console.log("\n🔐 Testing Sapphire privacy features...");
    
    try {
      const seed = await flag.generateEncryptionSeed();
      console.log("🎲 Encryption seed generated:", seed.substring(0, 10) + "...");
      
      const encrypted = await flag.encryptFlagReview("Test review", seed);
      console.log("🔒 Review encryption test successful");
      console.log("✅ All Sapphire features working!");
    } catch (error) {
      console.log("⚠️  Sapphire features test failed:", error.message);
    }
    
    // Get contract stats
    const [totalSubmitted, totalApproved, categoriesCount] = await flag.getContractStats();
    console.log("\n📈 Contract Statistics:");
    console.log(`   • Total flags submitted: ${totalSubmitted}`);
    console.log(`   • Total flags approved: ${totalApproved}`);
    console.log(`   • Available categories: ${categoriesCount}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: "sapphire-testnet",
      contractName: "Flag",
      address: flagAddress,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      features: {
        greenFlags: true,
        redFlags: true,
        encryptedFlags: true,
        anonymousFlags: true,
        flagCategories: categories,
        reputationSystem: true,
        sapphirePrivacy: true
      },
      gasUsed: "~6M gas",
      blockExplorer: `https://testnet.explorer.sapphire.oasis.dev/address/${flagAddress}`
    };
    
    // Create deployments directory
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info
    const deploymentFile = path.join(deploymentsDir, 'flag-contract-deployment.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📄 Deployment info saved to:", deploymentFile);
    
    // Environment variables
    console.log("\n🔧 Add to your .env file:");
    console.log(`NEXT_PUBLIC_FLAG_CONTRACT_ADDRESS=${flagAddress}`);
    console.log(`NEXT_PUBLIC_NETWORK=sapphire-testnet`);
    
    // Usage examples
    console.log("\n📋 Smart Contract Usage Examples:");
    console.log("=".repeat(60));
    
    console.log("\n🟢 Submit Green Flag:");
    console.log(`await flag.submitFlag(`);
    console.log(`  userAddress,`);
    console.log(`  false,                    // isRedFlag = false (green)`);
    console.log(`  "Great conversation!",    // review`);
    console.log(`  "communication",          // category`);
    console.log(`  0                         // severity (0 for green flags)`);
    console.log(`);`);
    
    console.log("\n🔴 Submit Red Flag:");
    console.log(`await flag.submitFlag(`);
    console.log(`  userAddress,`);
    console.log(`  true,                     // isRedFlag = true (red)`);
    console.log(`  "Was rude to waiter",     // review`);
    console.log(`  "behavior",               // category`);
    console.log(`  7                         // severity (1-10)`);
    console.log(`);`);
    
    console.log("\n🔐 Submit Encrypted Flag:");
    console.log(`const encrypted = await flag.encryptFlagReview("Sensitive info", seed);`);
    console.log(`await flag.submitEncryptedFlag(`);
    console.log(`  userAddress,`);
    console.log(`  true,`);
    console.log(`  encrypted,`);
    console.log(`  "safety",`);
    console.log(`  8`);
    console.log(`);`);
    
    console.log("\n👤 Submit Anonymous Flag:");
    console.log(`const flagId = await flag.submitAnonymousFlag(`);
    console.log(`  userAddress,`);
    console.log(`  false,`);
    console.log(`  "Very kind person",`);
    console.log(`  "kindness",`);
    console.log(`  0`);
    console.log(`);`);
    
    console.log("\n✅ Approve Flag:");
    console.log(`await flag.approveFlag(flagId);`);
    
    console.log("\n📊 Get Flag Statistics:");
    console.log(`const stats = await flag.getFlagStatistics(userAddress);`);
    console.log(`console.log("Green flags:", stats.greenFlags);`);
    console.log(`console.log("Red flags:", stats.redFlags);`);
    console.log(`console.log("Reputation:", await flag.userReputation(userAddress));`);
    
    console.log("\n🎉 Flag Contract Deployment Complete!");
    console.log("🔗 View on Sapphire Explorer:", `https://testnet.explorer.sapphire.oasis.dev/address/${flagAddress}`);
    
    return {
      flagContract: flagAddress,
      deployer: deployer.address,
      categories: categories
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Get more ROSE tokens");
      console.log("🔗 Faucet: https://faucet.testnet.oasis.dev/");
    } else if (error.message.includes("gas")) {
      console.log("\n💡 Solution: Try increasing gas limit or price");
    }
    
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = main;
