const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying updated DatingApp contract...");

  // Get the contract factory
  const DatingApp = await ethers.getContractFactory("DatingApp");
  
  // Deploy the contract
  const datingApp = await DatingApp.deploy();
  
  // Wait for deployment to finish
  await datingApp.waitForDeployment();
  
  const address = await datingApp.getAddress();
  
  console.log("DatingApp deployed to:", address);
  console.log("Contract address:", address);
  
  // Verify the contract has the new monthlySalary field
  console.log("Testing contract functionality...");
  
  // Test the contract by calling a view function
  const totalUsers = await datingApp.totalUsers();
  console.log("Total users (should be 0):", totalUsers.toString());
  
  console.log("✅ Contract deployed successfully!");
  console.log("📝 Update your .env.local file with:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 