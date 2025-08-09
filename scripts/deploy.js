const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FlagMeDaddy smart contract to Oasis Sapphire...");

  // Get the contract factory
  const DatingApp = await hre.ethers.getContractFactory("DatingApp");
  
  // Deploy the contract
  const datingApp = await DatingApp.deploy();
  
  // Wait for deployment to finish
  await datingApp.waitForDeployment();
  
  const address = await datingApp.getAddress();
  
  console.log("✅ FlagMeDaddy deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("🌐 Network:", hre.network.name);
  console.log("🔗 Explorer:", `https://testnet.explorer.sapphire.oasis.dev/address/${address}`);
  
  // Verify the contract on explorer
  console.log("\n🔍 Verifying contract on explorer...");
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.log("⚠️ Contract verification failed:", error.message);
  }
  
  console.log("\n📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update your .env.local file with NEXT_PUBLIC_CONTRACT_ADDRESS=" + address);
  console.log("3. Restart your development server");
  console.log("4. Test the application!");
}

// Handle errors
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
}); 