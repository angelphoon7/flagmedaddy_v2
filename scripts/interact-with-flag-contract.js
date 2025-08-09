require('dotenv').config();
const { ethers } = require('hardhat');

// Contract ABI for the Flag contract
const FLAG_ABI = [
  "function registerUser(address user) external",
  "function verifyUser(address user) external", 
  "function createMatch(address user1, address user2) external",
  "function submitFlag(address to, bool isRedFlag, string memory review, string memory category, uint8 severity) external returns (uint256)",
  "function submitAnonymousFlag(address to, bool isRedFlag, string memory review, string memory category, uint8 severity) external returns (uint256)",
  "function submitEncryptedFlag(address to, bool isRedFlag, bytes memory encryptedReview, string memory category, uint8 severity) external returns (uint256)",
  "function approveFlag(uint256 flagId) external",
  "function getFlagStatistics(address user) external view returns (uint256 totalFlags, uint256 redFlags, uint256 greenFlags, uint256 visibleFlags, uint256 pendingFlags)",
  "function getVisibleFlags(address user) external view returns (tuple(address from, address to, bool isRedFlag, string review, bytes encryptedReview, uint256 timestamp, bool isVisible, uint256 flagId, bool isEncrypted, string category, uint8 severity)[])",
  "function userReputation(address user) external view returns (int256)",
  "function generateEncryptionSeed() external view returns (uint256)",
  "function encryptFlagReview(string memory review, uint256 seed) external view returns (bytes memory)",
  "event FlagSubmitted(uint256 indexed flagId, address indexed from, address indexed to, bool isRedFlag, string category)",
  "event AnonymousFlagSubmitted(uint256 indexed flagId, address indexed to, bool isRedFlag, string category)"
];

const CONTRACT_ADDRESS = "0xE5347d0a90B2145d47e626ad135f860e8a3EFCD3";

async function main() {
  console.log("🚩 Interacting with Flag Smart Contract on Oasis Sapphire...");
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
  
  // Create some dummy user addresses for demonstration
  const user1 = deployer.address; // Use deployer as user1
  const user2 = ethers.getAddress("0x742d35cc6634c0532925a3b8d2c9c2e3b3f3fa8d"); // Dummy address for user2
  
  console.log("\n📋 Setting up users...");
  
  try {
    // Register and verify users
    console.log("📝 Registering users...");
    let tx = await flag.registerUser(user1);
    await tx.wait();
    console.log("✅ User1 registered:", user1);
    
    tx = await flag.registerUser(user2);
    await tx.wait();
    console.log("✅ User2 registered:", user2);
    
    // Verify users (only owner can verify)
    console.log("✔️ Verifying users...");
    tx = await flag.verifyUser(user1);
    await tx.wait();
    console.log("✅ User1 verified");
    
    tx = await flag.verifyUser(user2);
    await tx.wait();
    console.log("✅ User2 verified");
    
    // Create match between users
    console.log("💕 Creating match...");
    tx = await flag.createMatch(user1, user2);
    await tx.wait();
    console.log("✅ Match created between users");
    
  } catch (error) {
    console.log("ℹ️ Users might already be set up:", error.message);
  }
  
  console.log("\n🚩 Submitting Flags...");
  
  // 1. Submit a GREEN flag (positive feedback)
  console.log("\n🟢 Submitting GREEN flag...");
  try {
    const greenTx = await flag.submitFlag(
      user2,                    // to
      false,                    // isRedFlag = false (green)
      "Amazing conversation! Very respectful and kind person.",  // review
      "communication",          // category
      0                         // severity (0 for green flags)
    );
    
    console.log("⏳ Transaction hash:", greenTx.hash);
    const greenReceipt = await greenTx.wait();
    console.log("✅ GREEN flag submitted! Block:", greenReceipt.blockNumber);
    console.log("🔗 View on Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${greenTx.hash}`);
    
    // Get flag ID from events
    const flagEvent = greenReceipt.logs.find(log => {
      try {
        const parsed = flag.interface.parseLog(log);
        return parsed.name === 'FlagSubmitted';
      } catch (e) {
        return false;
      }
    });
    
    if (flagEvent) {
      const parsedEvent = flag.interface.parseLog(flagEvent);
      console.log("🎯 Flag ID:", parsedEvent.args.flagId.toString());
    }
    
  } catch (error) {
    console.error("❌ Error submitting green flag:", error.message);
  }
  
  // 2. Submit a RED flag (warning)
  console.log("\n🔴 Submitting RED flag...");
  try {
    const redTx = await flag.submitFlag(
      user2,                    // to
      true,                     // isRedFlag = true (red)
      "Was inappropriate and disrespectful during conversation.",  // review
      "behavior",               // category
      7                         // severity (1-10)
    );
    
    console.log("⏳ Transaction hash:", redTx.hash);
    const redReceipt = await redTx.wait();
    console.log("✅ RED flag submitted! Block:", redReceipt.blockNumber);
    console.log("🔗 View on Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${redTx.hash}`);
    
  } catch (error) {
    console.error("❌ Error submitting red flag:", error.message);
  }
  
  // 3. Submit an ANONYMOUS flag
  console.log("\n👤 Submitting ANONYMOUS flag...");
  try {
    const anonTx = await flag.submitAnonymousFlag(
      user2,                    // to
      true,                     // isRedFlag = true (red)
      "Safety concern - felt uncomfortable.",  // review
      "safety",                 // category
      8                         // severity
    );
    
    console.log("⏳ Transaction hash:", anonTx.hash);
    const anonReceipt = await anonTx.wait();
    console.log("✅ ANONYMOUS flag submitted! Block:", anonReceipt.blockNumber);
    console.log("🔗 View on Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${anonTx.hash}`);
    
  } catch (error) {
    console.error("❌ Error submitting anonymous flag:", error.message);
  }
  
  // 4. Submit an ENCRYPTED flag
  console.log("\n🔐 Submitting ENCRYPTED flag...");
  try {
    // Generate encryption seed
    const seed = await flag.generateEncryptionSeed();
    console.log("🎲 Generated encryption seed");
    
    // Encrypt the review
    const encryptedReview = await flag.encryptFlagReview("Sensitive information that should be private.", seed);
    console.log("🔒 Review encrypted");
    
    const encTx = await flag.submitEncryptedFlag(
      user2,                    // to
      false,                    // isRedFlag = false (green)
      encryptedReview,          // encrypted review
      "values",                 // category
      0                         // severity (0 for green)
    );
    
    console.log("⏳ Transaction hash:", encTx.hash);
    const encReceipt = await encTx.wait();
    console.log("✅ ENCRYPTED flag submitted! Block:", encReceipt.blockNumber);
    console.log("🔗 View on Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${encTx.hash}`);
    
  } catch (error) {
    console.error("❌ Error submitting encrypted flag:", error.message);
  }
  
  // 5. Get flag statistics
  console.log("\n📊 Getting flag statistics...");
  try {
    const stats = await flag.getFlagStatistics(user2);
    console.log("📈 Flag Statistics for", user2);
    console.log("   • Total flags:", stats.totalFlags.toString());
    console.log("   • Red flags:", stats.redFlags.toString());
    console.log("   • Green flags:", stats.greenFlags.toString());
    console.log("   • Visible flags:", stats.visibleFlags.toString());
    console.log("   • Pending flags:", stats.pendingFlags.toString());
    
    const reputation = await flag.userReputation(user2);
    console.log("   • Reputation score:", reputation.toString());
    
  } catch (error) {
    console.error("❌ Error getting statistics:", error.message);
  }
  
  // 6. Get visible flags
  console.log("\n👁️ Getting visible flags...");
  try {
    const flags = await flag.getVisibleFlags(user2);
    console.log("📋 Visible flags for", user2, ":", flags.length);
    
    flags.forEach((flagData, index) => {
      console.log(`\n   Flag ${index + 1}:`);
      console.log(`   • From: ${flagData.from}`);
      console.log(`   • Type: ${flagData.isRedFlag ? '🔴 RED' : '🟢 GREEN'}`);
      console.log(`   • Category: ${flagData.category}`);
      console.log(`   • Severity: ${flagData.severity}`);
      console.log(`   • Review: ${flagData.review || '(encrypted/anonymous)'}`);
      console.log(`   • Flag ID: ${flagData.flagId}`);
      console.log(`   • Encrypted: ${flagData.isEncrypted}`);
    });
    
  } catch (error) {
    console.error("❌ Error getting flags:", error.message);
  }
  
  console.log("\n🎉 All transactions completed!");
  console.log("🔍 Check the Sapphire Explorer to see your transactions:");
  console.log("🌐 https://testnet.explorer.sapphire.oasis.dev/address/" + CONTRACT_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
