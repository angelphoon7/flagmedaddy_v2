require('dotenv').config();
const { ethers } = require('hardhat');

const CONTRACT_ADDRESS = "0xE5347d0a90B2145d47e626ad135f860e8a3EFCD3";

async function main() {
  console.log("🚩 Submitting REAL Flag Transactions to Blockchain...");
  console.log("📍 Contract Address:", CONTRACT_ADDRESS);
  
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Account:", deployer.address);
  
  // Get contract instance
  const Flag = await ethers.getContractFactory("Flag");
  const flag = Flag.attach(CONTRACT_ADDRESS);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ROSE");
  
  // Create a second user address (we'll use the deployer as both users for simplicity)
  const user1 = deployer.address;
  const user2 = deployer.address; // Self-flagging for demo purposes
  
  console.log("\n📋 Setting up users (if needed)...");
  
  try {
    // Try to register and verify users
    console.log("📝 Registering user...");
    let tx = await flag.registerUser(user1);
    await tx.wait();
    console.log("✅ User registered");
    
    tx = await flag.verifyUser(user1);
    await tx.wait();
    console.log("✅ User verified");
    
    // Create a match with self for demo
    tx = await flag.createMatch(user1, user2);
    await tx.wait();
    console.log("✅ Match created");
    
  } catch (error) {
    console.log("ℹ️ User setup might already exist:", error.message.substring(0, 100));
  }
  
  console.log("\n🚩 Submitting Real Flag Transactions...");
  
  // 1. Submit a GREEN flag transaction
  console.log("\n🟢 Submitting GREEN flag transaction...");
  try {
    const greenTx = await flag.submitFlag(
      user2,                    // to (self for demo)
      false,                    // isRedFlag = false (green)
      "Excellent communication skills and very respectful!",  // review
      "communication",          // category
      0,                        // severity (0 for green flags)
      { gasLimit: 500000 }      // Extra gas
    );
    
    console.log("⏳ Transaction submitted! Hash:", greenTx.hash);
    console.log("🔗 View on Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${greenTx.hash}`);
    
    const receipt = await greenTx.wait();
    console.log("✅ GREEN flag transaction confirmed! Block:", receipt.blockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    // Parse events
    if (receipt.logs.length > 0) {
      try {
        const parsedLogs = receipt.logs.map(log => {
          try {
            return flag.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        }).filter(log => log !== null);
        
        if (parsedLogs.length > 0) {
          console.log("📢 Events emitted:");
          parsedLogs.forEach(log => {
            console.log(`   • ${log.name}:`, log.args);
          });
        }
      } catch (e) {
        console.log("📢 Events emitted (raw):", receipt.logs.length);
      }
    }
    
  } catch (error) {
    console.error("❌ Green flag transaction failed:", error.message.substring(0, 200));
  }
  
  // Wait a bit between transactions
  console.log("⏳ Waiting 3 seconds...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 2. Submit a RED flag transaction
  console.log("\n🔴 Submitting RED flag transaction...");
  try {
    const redTx = await flag.submitFlag(
      user2,                    // to (self for demo)
      true,                     // isRedFlag = true (red)
      "Showed concerning behavior during our interaction.",  // review
      "behavior",               // category
      6,                        // severity (1-10)
      { gasLimit: 500000 }      // Extra gas
    );
    
    console.log("⏳ Transaction submitted! Hash:", redTx.hash);
    console.log("🔗 View on Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${redTx.hash}`);
    
    const receipt = await redTx.wait();
    console.log("✅ RED flag transaction confirmed! Block:", receipt.blockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
  } catch (error) {
    console.error("❌ Red flag transaction failed:", error.message.substring(0, 200));
  }
  
  // Wait a bit between transactions
  console.log("⏳ Waiting 3 seconds...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 3. Submit an ANONYMOUS flag transaction
  console.log("\n👤 Submitting ANONYMOUS flag transaction...");
  try {
    const anonTx = await flag.submitAnonymousFlag(
      user2,                    // to (self for demo)
      true,                     // isRedFlag = true (red)
      "Safety concern - felt uncomfortable during meeting.",  // review
      "safety",                 // category
      8,                        // severity
      { gasLimit: 500000 }      // Extra gas
    );
    
    console.log("⏳ Transaction submitted! Hash:", anonTx.hash);
    console.log("🔗 View on Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${anonTx.hash}`);
    
    const receipt = await anonTx.wait();
    console.log("✅ ANONYMOUS flag transaction confirmed! Block:", receipt.blockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
  } catch (error) {
    console.error("❌ Anonymous flag transaction failed:", error.message.substring(0, 200));
  }
  
  // 4. Get updated statistics
  console.log("\n📊 Checking updated flag statistics...");
  try {
    const stats = await flag.getFlagStatistics(user2);
    console.log("📈 Flag Statistics:");
    console.log("   • Total flags:", stats.totalFlags.toString());
    console.log("   • Red flags:", stats.redFlags.toString());
    console.log("   • Green flags:", stats.greenFlags.toString());
    console.log("   • Visible flags:", stats.visibleFlags.toString());
    console.log("   • Pending flags:", stats.pendingFlags.toString());
    
    const reputation = await flag.userReputation(user2);
    console.log("   • Reputation score:", reputation.toString());
    
  } catch (error) {
    console.error("❌ Error getting statistics:", error.message.substring(0, 100));
  }
  
  console.log("\n🎉 Real blockchain transactions completed!");
  console.log("🔍 All your transactions are now on the Oasis Sapphire blockchain!");
  console.log("🌐 Contract Explorer:", `https://testnet.explorer.sapphire.oasis.dev/address/${CONTRACT_ADDRESS}`);
  console.log("📊 Your account:", `https://testnet.explorer.sapphire.oasis.dev/address/${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
