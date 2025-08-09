const { ethers } = require("hardhat");

async function main() {
  console.log("Checking KYC contract verifier status...");
  
  const contractAddress = "0x163AddEb29b1232D9FE7944CF9BC8E9761411154";
  const backendAddress = "0x93e1FA4fe8B563bAb2A5dC7Fd1b134C138984b1D";
  
  // Get contract instance
  const KYCProfile = await ethers.getContractFactory("KYCProfile");
  const contract = KYCProfile.attach(contractAddress);
  
  console.log("Contract Address:", contractAddress);
  console.log("Backend Address:", backendAddress);
  
  // Check if backend is authorized verifier
  const isAuthorized = await contract.authorizedVerifiers(backendAddress);
  console.log("Backend is authorized verifier:", isAuthorized);
  
  // Check contract owner
  const owner = await contract.owner();
  console.log("Contract Owner:", owner);
  
  if (!isAuthorized) {
    console.log("\n❌ Backend is NOT authorized as verifier!");
    console.log("This is why transactions are failing.");
    console.log("\nTo fix this, the contract owner needs to call:");
    console.log(`contract.addAuthorizedVerifier("${backendAddress}")`);
  } else {
    console.log("\n✅ Backend is authorized as verifier!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 