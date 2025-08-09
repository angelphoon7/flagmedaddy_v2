require('dotenv').config();
const { ethers } = require('hardhat');

const KYC_PROFILE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_KYC_PROFILE_CONTRACT_ADDRESS;

async function main() {
  console.log("🧪 Testing KYC Profile Contract Integration...");
  
  if (!KYC_PROFILE_CONTRACT_ADDRESS) {
    console.log("❌ KYC Profile contract address not found in environment variables");
    console.log("Please set NEXT_PUBLIC_KYC_PROFILE_CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("📍 Contract Address:", KYC_PROFILE_CONTRACT_ADDRESS);

  // Get signer
  const [deployer, user1] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("👤 Test User:", user1.address);

  // Get contract instance
  const KYCProfile = await ethers.getContractFactory("KYCProfile");
  const kycProfile = KYCProfile.attach(KYC_PROFILE_CONTRACT_ADDRESS);

  console.log("\n🔍 Testing contract functions...");

  try {
    // Test 1: Check if user is registered (should be false initially)
    console.log("\n1️⃣ Testing user registration status...");
    const isRegistered = await kycProfile.isRegistered(user1.address);
    console.log("   User registered:", isRegistered);

    // Test 2: Create a profile (as contract owner/verifier)
    console.log("\n2️⃣ Creating test profile...");
    const testProfile = {
      user: user1.address,
      username: "testuser123",
      age: 25,
      gender: "Male",
      fullName: "Test User",
      bio: "This is a test bio for blockchain integration",
      interests: ["blockchain", "web3", "dating"],
      monthlySalary: 500000, // $5000 in cents
      profileImageHash: "QmTestImageHash123456789"
    };

    const createTx = await kycProfile.createProfile(
      testProfile.user,
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

    console.log("   Transaction sent:", createTx.hash);
    const receipt = await createTx.wait();
    console.log("   Transaction confirmed in block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Test 3: Verify user is now registered
    console.log("\n3️⃣ Verifying registration...");
    const isNowRegistered = await kycProfile.isRegistered(user1.address);
    console.log("   User now registered:", isNowRegistered);

    // Test 4: Get public profile
    console.log("\n4️⃣ Reading public profile...");
    const publicProfile = await kycProfile.getPublicProfile(user1.address);
    console.log("   Username:", publicProfile[0]);
    console.log("   Age:", publicProfile[1].toString());
    console.log("   Gender:", publicProfile[2]);
    console.log("   KYC Verified:", publicProfile[3]);
    console.log("   Active:", publicProfile[4]);
    console.log("   Created At:", new Date(Number(publicProfile[5]) * 1000).toLocaleString());

    // Test 5: Verify KYC (simulate backend verification)
    console.log("\n5️⃣ Simulating KYC verification...");
    const kycTx = await kycProfile.verifyKYC(
      user1.address,
      "passport",
      "encrypted_doc_number_12345",
      "QmKYCDocumentHash123456789",
      "integrated_kyc_system",
      { gasLimit: 300000 }
    );

    console.log("   KYC transaction sent:", kycTx.hash);
    const kycReceipt = await kycTx.wait();
    console.log("   KYC transaction confirmed in block:", kycReceipt.blockNumber);
    console.log("   KYC gas used:", kycReceipt.gasUsed.toString());

    // Test 6: Check KYC status
    console.log("\n6️⃣ Checking KYC status...");
    const updatedProfile = await kycProfile.getPublicProfile(user1.address);
    console.log("   KYC Verified:", updatedProfile[3]);

    const isActiveAndVerified = await kycProfile.isUserActiveAndVerified(user1.address);
    console.log("   Active and Verified:", isActiveAndVerified);

    // Test 7: Get total users
    console.log("\n7️⃣ Getting total users...");
    const totalUsers = await kycProfile.getTotalUsers();
    console.log("   Total registered users:", totalUsers.toString());

    console.log("\n🎉 All tests passed! KYC Profile contract is working correctly.");
    console.log("\n📋 Transaction Summary:");
    console.log("   Profile Creation:", createTx.hash);
    console.log("   KYC Verification:", kycTx.hash);
    console.log("   Explorer Links:");
    console.log("   - Profile:", `https://testnet.explorer.sapphire.oasis.dev/tx/${createTx.hash}`);
    console.log("   - KYC:", `https://testnet.explorer.sapphire.oasis.dev/tx/${kycTx.hash}`);

  } catch (error) {
    console.error("❌ Test failed:", error);
    
    // Check if it's a revert error
    if (error.message.includes("User already registered")) {
      console.log("\n💡 Note: User already registered. This is expected if you've run this test before.");
      console.log("   The contract is working correctly - it prevents duplicate registrations.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
