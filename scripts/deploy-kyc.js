const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying KYCProfile contract to Oasis Sapphire...");

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the KYCProfile contract
  const KYCProfile = await ethers.getContractFactory("KYCProfile");
  const kycProfile = await KYCProfile.deploy();

  await kycProfile.waitForDeployment();

  const contractAddress = await kycProfile.getAddress();
  console.log("KYCProfile contract deployed to:", contractAddress);

  // Verify deployment
  console.log("Verifying deployment...");
  const totalUsers = await kycProfile.getTotalUsers();
  console.log("Total users initially:", totalUsers.toString());

  const owner = await kycProfile.owner();
  console.log("Contract owner:", owner);

  const isVerifier = await kycProfile.authorizedVerifiers(deployer.address);
  console.log("Deployer is authorized verifier:", isVerifier);

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contractAddress);
  console.log("Owner Address:", owner);
  console.log("Network: Oasis Sapphire Testnet");
  console.log("Block Explorer: https://testnet.explorer.sapphire.oasis.dev");

  console.log("\n=== Environment Variables ===");
  console.log("Add these to your .env files:");
  console.log(`NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`KYC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`BACKEND_PRIVATE_KEY=${process.env.PRIVATE_KEY || 'YOUR_BACKEND_PRIVATE_KEY'}`);

  console.log("\n=== Backend Setup ===");
  console.log("1. Set environment variables in backend/.env");
  console.log("2. Install backend dependencies: npm install");
  console.log("3. Start backend: node backend/kycService.js");

  console.log("\n=== Frontend Setup ===");
  console.log("1. Add NEXT_PUBLIC_KYC_CONTRACT_ADDRESS to .env.local");
  console.log("2. Add NEXT_PUBLIC_KYC_BACKEND_URL=http://localhost:3001 to .env.local");

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 