require('dotenv').config();

// Test the KYC service with proper data formatting
async function testKYCService() {
  console.log("🔧 Testing KYC Service with Fixed Array Handling...");

  // Import the service
  const kycProfileService = require('../utils/kycProfileService').default;

  try {
    // Initialize the service
    await kycProfileService.initialize();
    console.log("✅ Service initialized successfully");

    // Test data that matches what your frontend sends
    const testProfileData = {
      userAddress: "0x742d35Cc6634C0532925a3b8D404d1dc1b4c4e52", // Your wallet address
      username: "testuser123",
      fullName: "Test User Full Name",
      age: 25,
      gender: "Male",
      bio: "This is a test bio for the dating app",
      interests: "blockchain, web3, dating, technology", // String format
      monthlySalary: 5000.00,
      dateOfBirth: "1998-01-01",
      documentType: "passport",
      documentNumber: "P123456789",
      kycProvider: "test"
    };

    const testFiles = {
      profileImage: {
        name: "profile.jpg",
        size: 1024000
      },
      idDocument: {
        name: "passport.pdf",
        size: 2048000
      }
    };

    console.log("\n📋 Test Profile Data:");
    console.log("- Username:", testProfileData.username);
    console.log("- Age:", testProfileData.age);
    console.log("- Interests:", testProfileData.interests);
    console.log("- Monthly Salary:", testProfileData.monthlySalary);

    console.log("\n🚀 Creating profile...");
    const result = await kycProfileService.createProfile(testProfileData, testFiles);

    console.log("\n🎉 SUCCESS! Profile created:");
    console.log("- Profile Transaction:", result.data.profileTransaction);
    console.log("- KYC Transaction:", result.data.kycTransaction);
    console.log("- Explorer Link:", result.data.explorerLinks?.profile);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("invalid array value")) {
      console.log("\n💡 Array formatting issue detected. Checking interests processing...");
      
      // Test interests processing
      const testInterests = "blockchain, web3, dating, technology";
      const interestsArray = testInterests.split(',').map(i => i.trim()).filter(i => i.length > 0);
      console.log("Original:", testInterests);
      console.log("Processed:", interestsArray);
      console.log("Array valid:", Array.isArray(interestsArray) && interestsArray.every(i => typeof i === 'string'));
    }
    
    if (error.message.includes("User already registered")) {
      console.log("\n💡 User already registered - this is expected if you've tested before.");
    }
    
    if (error.message.includes("not authorized")) {
      console.log("\n💡 Authorization issue - you may need to deploy the self-service contract:");
      console.log("   npx hardhat run scripts/deploy-kyc-self-service.js --network sapphireTestnet");
    }
  }
}

// Run the test
testKYCService()
  .then(() => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
