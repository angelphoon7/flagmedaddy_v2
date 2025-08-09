const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying UserProfile contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the UserProfile contract
  const UserProfile = await ethers.getContractFactory("UserProfile");
  const userProfile = await UserProfile.deploy();

  await userProfile.waitForDeployment();

  console.log("UserProfile contract deployed to:", await userProfile.getAddress());

  // Verify deployment
  console.log("Verifying deployment...");
  const totalUsers = await userProfile.getTotalUsers();
  console.log("Total users initially:", totalUsers.toString());

  console.log("Deployment completed successfully!");
  console.log("Contract address:", await userProfile.getAddress());
  console.log("Save this address to your .env.local file as NEXT_PUBLIC_PROFILE_CONTRACT_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 