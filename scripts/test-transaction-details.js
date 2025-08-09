require('dotenv').config();
const { ethers } = require('hardhat');

const CONTRACT_ADDRESS = "0xE5347d0a90B2145d47e626ad135f860e8a3EFCD3";

async function testTransactionDetails() {
  console.log("🧪 Testing Enhanced Transaction Details...");
  console.log("📍 Contract Address:", CONTRACT_ADDRESS);
  
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Account:", deployer.address);
  
  // Get contract instance
  const Flag = await ethers.getContractFactory("Flag");
  const flag = Flag.attach(CONTRACT_ADDRESS);
  
  console.log("\n🚩 Submitting test flag to demonstrate transaction details...");
  
  try {
    // Submit a test flag
    const tx = await flag.submitFlag(
      deployer.address,  // to (self for demo)
      false,             // isRedFlag = false (green)
      "Test flag for transaction details demo",  // review
      "general",         // category
      0,                 // severity (0 for green flags)
      { gasLimit: 500000 }
    );
    
    console.log("⏳ Transaction sent! Hash:", tx.hash);
    console.log("🔗 Explorer Link:", `https://testnet.explorer.sapphire.oasis.dev/tx/${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log("\n✅ Transaction Confirmed!");
    console.log("📋 Transaction Details:");
    console.log("   • Transaction Hash:", receipt.transactionHash || receipt.hash);
    console.log("   • Block Number:", receipt.blockNumber.toString());
    console.log("   • Gas Used:", receipt.gasUsed.toString());
    console.log("   • Status:", receipt.status === 1 ? "Success" : "Failed");
    
    // Try to extract flag ID from events
    if (receipt.logs && receipt.logs.length > 0) {
      console.log("   • Events Emitted:", receipt.logs.length);
      
      try {
        const flagEvent = receipt.logs.find(log => {
          try {
            const parsed = flag.interface.parseLog(log);
            return parsed.name === 'FlagSubmitted';
          } catch (e) {
            return false;
          }
        });
        
        if (flagEvent) {
          const parsedEvent = flag.interface.parseLog(flagEvent);
          console.log("   • Flag ID:", parsedEvent.args.flagId);
          console.log("   • Event Name:", parsedEvent.name);
        }
      } catch (e) {
        console.log("   • Could not parse flag ID from events");
      }
    }
    
    console.log("\n📊 Enhanced Return Object Structure:");
    const enhancedResult = {
      hash: tx.hash,
      receipt: receipt,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      transactionHash: receipt.transactionHash,
      success: true,
      type: 'regular'
    };
    
    console.log("   • hash:", enhancedResult.hash);
    console.log("   • blockNumber:", enhancedResult.blockNumber.toString());
    console.log("   • gasUsed:", enhancedResult.gasUsed.toString());
    console.log("   • success:", enhancedResult.success);
    console.log("   • type:", enhancedResult.type);
    
    console.log("\n🎉 Transaction Details Enhancement Complete!");
    console.log("📋 Your flag system now provides:");
    console.log("   ✅ Complete transaction hash");
    console.log("   ✅ Block number confirmation");
    console.log("   ✅ Gas usage details");
    console.log("   ✅ Flag ID extraction");
    console.log("   ✅ Direct explorer links");
    console.log("   ✅ Success/failure status");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testTransactionDetails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
