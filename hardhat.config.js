require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sapphireTestnet: {
      url: "https://testnet.sapphire.oasis.dev",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 23295,
      gasPrice: 100000000000, // 100 gwei - higher for Oasis Sapphire
      gas: 10000000, // 10M gas limit
    },
    sapphireMainnet: {
      url: "https://sapphire.oasis.dev",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 23294,
      gasPrice: 1000000000, // 1 gwei
    }
  },
  etherscan: {
    apiKey: {
      sapphireTestnet: "not-needed",
      sapphireMainnet: "not-needed"
    },
    customChains: [
      {
        network: "sapphireTestnet",
        chainId: 23295,
        urls: {
          apiURL: "https://testnet.explorer.sapphire.oasis.dev/api",
          browserURL: "https://testnet.explorer.sapphire.oasis.dev"
        }
      },
      {
        network: "sapphireMainnet",
        chainId: 23294,
        urls: {
          apiURL: "https://explorer.sapphire.oasis.dev/api",
          browserURL: "https://explorer.sapphire.oasis.dev"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}; 