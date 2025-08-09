require('dotenv').config();
const { ethers } = require('hardhat');

const CONTRACT_ADDRESS = "0xE5347d0a90B2145d47e626ad135f860e8a3EFCD3";

async function main() {
  console.log("🧪 Testing Enhanced Flag Contract Rating System...");
  console.log("📍 Contract Address:", CONTRACT_ADDRESS);
  
  // Get signers
  const [owner, user1, user2, user3] = await ethers.getSigners();
  console.log("👤 Owner:", owner.address);
  console.log("👤 User1:", user1.address);
  console.log("👤 User2:", user2.address);
  console.log("👤 User3:", user3.address);
  
  // Get contract instance
  const Flag = await ethers.getContractFactory("Flag");
  const flag = Flag.attach(CONTRACT_ADDRESS);
  
  console.log("\n📋 Setting up test scenario...");
  
  try {
    // Register and verify users
    console.log("📝 Registering users...");
    await (await flag.connect(owner).registerUser(user1.address)).wait();
    await (await flag.connect(owner).registerUser(user2.address)).wait();
    await (await flag.connect(owner).registerUser(user3.address)).wait();
    
    await (await flag.connect(owner).verifyUser(user1.address)).wait();
    await (await flag.connect(owner).verifyUser(user2.address)).wait();
    await (await flag.connect(owner).verifyUser(user3.address)).wait();
    
    // Create matches
    console.log("💕 Creating matches...");
    await (await flag.connect(owner).createMatch(user1.address, user2.address)).wait();
    await (await flag.connect(owner).createMatch(user2.address, user3.address)).wait();
    await (await flag.connect(owner).createMatch(user1.address, user3.address)).wait();
    
    console.log("✅ Setup complete!");
    
    console.log("\n🚩 Testing Flag Submission with Rating System...");
    
    // Test Case 1: Submit various flags for user2
    console.log("\n📊 Test Case 1: Building user2's reputation...");
    
    // User1 flags user2 (positive communication)
    await (await flag.connect(user1).submitFlag(
      user2.address, false, "Great communicator, very engaging!", "communication", 0
    )).wait();
    console.log("✅ Green flag submitted: communication");
    
    // User3 flags user2 (positive behavior)
    await (await flag.connect(user3).submitFlag(
      user2.address, false, "Very respectful and kind person", "behavior", 0
    )).wait();
    console.log("✅ Green flag submitted: behavior");
    
    // User1 flags user2 (safety concern)
    await (await flag.connect(user1).submitFlag(
      user2.address, true, "Made me feel uncomfortable during date", "safety", 7
    )).wait();
    console.log("✅ Red flag submitted: safety (severity 7)");
    
    // User3 flags user2 (kindness)
    await (await flag.connect(user3).submitFlag(
      user2.address, false, "Helped elderly person cross street", "kindness", 0
    )).wait();
    console.log("✅ Green flag submitted: kindness");
    
    console.log("\n📈 Getting user2's rating before approval...");
    let rating = await flag.getUserRating(user2.address);
    console.log("Rating (before approval):", {
      overallScore: rating.overallScore.toString(),
      safetyScore: rating.safetyScore.toString(),
      behaviorScore: rating.behaviorScore.toString(),
      communicationScore: rating.communicationScore.toString(),
      kindnessScore: rating.kindnessScore.toString(),
      reliabilityScore: rating.reliabilityScore.toString(),
      ratingTier: rating.ratingTier,
      totalInteractions: rating.totalInteractions.toString(),
      positivePercentage: rating.positivePercentage.toString(),
      isRecommended: rating.isRecommended
    });
    
    // Approve flags to make them visible
    console.log("\n✅ Approving flags...");
    const user2Flags = await flag.getVisibleFlags(user2.address);
    console.log("Flags to approve:", user2Flags.length);
    
    // Note: In real scenario, user2 would approve their own flags
    // For testing, we'll simulate this
    
    console.log("\n📊 Getting flag statistics...");
    const stats = await flag.getFlagStatistics(user2.address);
    console.log("Flag Statistics:", {
      totalFlags: stats.totalFlags.toString(),
      redFlags: stats.redFlags.toString(),
      greenFlags: stats.greenFlags.toString(),
      visibleFlags: stats.visibleFlags.toString(),
      pendingFlags: stats.pendingFlags.toString(),
      averageRating: stats.averageRating.toString()
    });
    
    console.log("\n📋 Getting category-specific stats...");
    const categories = await flag.getFlagCategories();
    console.log("Available categories:", categories);
    
    for (let category of categories.slice(0, 5)) { // Test first 5 categories
      try {
        const categoryStats = await flag.getCategoryStats(user2.address, category);
        if (categoryStats.totalCount.toNumber() > 0) {
          console.log(`${category} stats:`, {
            totalCount: categoryStats.totalCount.toString(),
            redCount: categoryStats.redCount.toString(),
            greenCount: categoryStats.greenCount.toString(),
            averageSeverity: categoryStats.averageSeverity.toString(),
            categoryScore: categoryStats.categoryScore.toString()
          });
        }
      } catch (error) {
        console.log(`Error getting ${category} stats:`, error.message);
      }
    }
    
    console.log("\n🎯 Testing anonymous flags...");
    const anonTx = await flag.connect(user1).submitAnonymousFlag(
      user2.address, true, "Concerning behavior but want to stay anonymous", "behavior", 8
    );
    const anonReceipt = await anonTx.wait();
    console.log("✅ Anonymous flag submitted");
    
    console.log("\n🔐 Testing encrypted flags...");
    const seed = await flag.generateEncryptionSeed();
    const encryptedReview = await flag.encryptFlagReview("Sensitive private information", seed);
    await (await flag.connect(user3).submitEncryptedFlag(
      user2.address, false, encryptedReview, "reliability", 0
    )).wait();
    console.log("✅ Encrypted flag submitted");
    
    console.log("\n📊 Final rating after all flags...");
    rating = await flag.getUserRating(user2.address);
    console.log("Final Rating:", {
      overallScore: rating.overallScore.toString(),
      safetyScore: rating.safetyScore.toString(),
      behaviorScore: rating.behaviorScore.toString(),
      communicationScore: rating.communicationScore.toString(),
      kindnessScore: rating.kindnessScore.toString(),
      reliabilityScore: rating.reliabilityScore.toString(),
      ratingTier: rating.ratingTier,
      totalInteractions: rating.totalInteractions.toString(),
      positivePercentage: rating.positivePercentage.toString(),
      isRecommended: rating.isRecommended
    });
    
    console.log("\n📈 Testing flag type distribution...");
    const distribution = await flag.getFlagTypeDistribution(user2.address);
    console.log("Flag Distribution:", {
      categories: distribution[0],
      redCounts: distribution[1].map(n => n.toString()),
      greenCounts: distribution[2].map(n => n.toString()),
      categoryScores: distribution[3].map(n => n.toString())
    });
    
    console.log("\n🏆 Testing reputation system...");
    const reputation = await flag.userReputation(user2.address);
    console.log("User2 Reputation Score:", reputation.toString());
    
    console.log("\n📊 Contract Statistics:");
    const contractStats = await flag.getContractStats();
    console.log("Total flags submitted:", contractStats[0].toString());
    console.log("Total flags approved:", contractStats[1].toString());
    console.log("Available categories:", contractStats[2].toString());
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
  
  console.log("\n🎉 Rating System Test Complete!");
  console.log("🔗 View contract on explorer:");
  console.log(`https://testnet.explorer.sapphire.oasis.dev/address/${CONTRACT_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
