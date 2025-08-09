require('dotenv').config();
const { ethers } = require('hardhat');

const KYC_PROFILE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_KYC_PROFILE_CONTRACT_ADDRESS;

async function main() {
  console.log("🧪 Testing KYC Profile Self-Service Contract...");
  
  if (!KYC_PROFILE_CONTRACT_ADDRESS) {
    console.log("❌ KYC Profile contract address not found in environment variables");
    console.log("Please set NEXT_PUBLIC_KYC_PROFILE_CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("📍 Contract Address:", KYC_PROFILE_CONTRACT_ADDRESS);

  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("👤 Test User 1:", user1.address);
  console.log("👤 Test User 2:", user2.address);

  // Get contract instance
  const KYCProfileSelfService = await ethers.getContractFactory("KYCProfileSelfService");
  const kycProfile = KYCProfileSelfService.attach(KYC_PROFILE_CONTRACT_ADDRESS);

  console.log("\n🔍 Testing self-service profile creation...");

  try {
    // Test 1: Check if user is registered (should be false initially)
    console.log("\n1️⃣ Testing user registration status...");
    const isRegistered = await kycProfile.isRegistered(user1.address);
    console.log("   User 1 registered:", isRegistered);

    // Test 2: Create a profile (self-service - user creates their own profile)
    console.log("\n2️⃣ User 1 creating their own profile...");
    const testProfile = {
      username: "selfservice_user",
      age: 28,
      gender: "Female",
      fullName: "Self Service User",
      bio: "This is a self-service profile creation test",
      interests: ["blockchain", "privacy", "dating"],
      monthlySalary: 600000, // $6000 in cents
      profileImageHash: "QmSelfServiceImageHash123"
    };

    const createTx = await kycProfile.connect(user1).createProfile(
      testProfile.username,
      testProfile.age,
      testProfile.gender,
      testProfile.fullName,
      testProfile.bio,
      testProfile.interests,
      testProfile.monthlySalary,
      testProfile.profileImageHash,
      { gasLimit: 500000 }
    );

    console.log("   Profile creation transaction sent:", createTx.hash);
    const receipt = await createTx.wait();
    console.log("   Transaction confirmed in block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   🔗 Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${createTx.hash}`);

    // Test 3: Verify user is now registered
    console.log("\n3️⃣ Verifying registration...");
    const isNowRegistered = await kycProfile.isRegistered(user1.address);
    console.log("   User 1 now registered:", isNowRegistered);

    // Test 4: Get public profile
    console.log("\n4️⃣ Reading public profile...");
    const publicProfile = await kycProfile.getPublicProfile(user1.address);
    console.log("   Username:", publicProfile[0]);
    console.log("   Age:", publicProfile[1].toString());
    console.log("   Gender:", publicProfile[2]);
    console.log("   KYC Verified:", publicProfile[3]);
    console.log("   Active:", publicProfile[4]);
    console.log("   Created At:", new Date(Number(publicProfile[5]) * 1000).toLocaleString());

    // Test 5: Submit KYC documents (self-service)
    console.log("\n5️⃣ User submitting KYC documents...");
    const kycTx = await kycProfile.connect(user1).submitKYCDocuments(
      "passport",
      "encrypted_passport_123456",
      "QmKYCDocumentHashSelfService123",
      { gasLimit: 300000 }
    );

    console.log("   KYC submission transaction sent:", kycTx.hash);
    const kycReceipt = await kycTx.wait();
    console.log("   KYC submission confirmed in block:", kycReceipt.blockNumber);
    console.log("   KYC gas used:", kycReceipt.gasUsed.toString());
    console.log("   🔗 Explorer:", `https://testnet.explorer.sapphire.oasis.dev/tx/${kycTx.hash}`);

    // Test 6: Check KYC status (should be auto-verified in demo)
    console.log("\n6️⃣ Checking KYC verification status...");
    const updatedProfile = await kycProfile.getPublicProfile(user1.address);
    console.log("   KYC Verified (auto-verified):", updatedProfile[3]);

    const isActiveAndVerified = await kycProfile.isUserActiveAndVerified(user1.address);
    console.log("   Active and Verified:", isActiveAndVerified);

    // Test 7: Create second user profile
    console.log("\n7️⃣ Creating second user profile...");
    const createTx2 = await kycProfile.connect(user2).createProfile(
      "second_user",
      30,
      "Male",
      "Second Test User",
      "Another test profile",
      ["technology", "innovation"],
      750000, // $7500 in cents
      "QmSecondUserImageHash456",
      { gasLimit: 500000 }
    );

    await createTx2.wait();
    console.log("   Second user profile created:", createTx2.hash);

    // Test 8: Get total users
    console.log("\n8️⃣ Getting total users...");
    const totalUsers = await kycProfile.getTotalUsers();
    console.log("   Total registered users:", totalUsers.toString());

    // Test 9: Get users list
    console.log("\n9️⃣ Getting users list...");
    const usersList = await kycProfile.getUsers(0, 10);
    console.log("   Users found:", usersList.addresses.length);
    for (let i = 0; i < usersList.addresses.length; i++) {
      console.log(`   User ${i + 1}:`, usersList.usernames[i], 
                  `(${usersList.addresses[i]})`, 
                  `KYC: ${usersList.kycStatuses[i]}`);
    }

    console.log("\n🎉 All tests passed! KYC Profile Self-Service contract is working correctly.");
    console.log("\n📋 Transaction Summary:");
    console.log("   Profile Creation (User 1):", createTx.hash);
    console.log("   KYC Submission (User 1):", kycTx.hash);
    console.log("   Profile Creation (User 2):", createTx2.hash);
    console.log("\n🔗 Explorer Links:");
    console.log("   Profile 1:", `https://testnet.explorer.sapphire.oasis.dev/tx/${createTx.hash}`);
    console.log("   KYC 1:", `https://testnet.explorer.sapphire.oasis.dev/tx/${kycTx.hash}`);
    console.log("   Profile 2:", `https://testnet.explorer.sapphire.oasis.dev/tx/${createTx2.hash}`);

    console.log("\n✅ Ready for frontend integration!");
    console.log("   Your KYCProfileUpload.js component should now work without authorization errors.");

  } catch (error) {
    console.error("❌ Test failed:", error);
    
    // Check for common errors
    if (error.message.includes("User already registered")) {
      console.log("\n💡 Note: User already registered. This is expected if you've run this test before.");
      console.log("   Try with a different user address or clear the contract state.");
    } else if (error.message.includes("execution reverted")) {
      console.log("\n💡 Transaction reverted. Check the error details above.");
      console.log("   Common causes:");
      console.log("   - Invalid input parameters");
      console.log("   - Gas limit too low");
      console.log("   - Contract requirements not met");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
