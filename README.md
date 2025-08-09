# 💘 FlagMeDaddy - Dating App on Oasis Sapphire

A decentralized dating application built on Oasis Sapphire blockchain with Rose Wallet integration, featuring user verification, matching, and a unique flagging system for post-date reviews.

## 🌟 Features

- **Rose Wallet Integration**: Secure login using Oasis Rose Wallet
- **User Verification**: Smart contract-based profile verification system
- **Matching System**: Connect with other verified users
- **Flag System**: Submit red flags (bad) or green flags (good) after dates
- **Review System**: 10-word maximum reviews with approval mechanism
- **Privacy**: Flags are only visible after mutual approval
- **Community Review**: All flags are reviewed by the community

## 🏗️ Architecture

### Smart Contract (`contracts/DatingApp.sol`)
- User registration and profile management
- Verification system
- Matching functionality
- Flag submission and approval system
- Privacy controls for flag visibility

### Frontend Components
- **WalletConnect**: Rose Wallet integration
- **UserRegistration**: Profile creation
- **Navigation**: App navigation and user status
- **Matches**: View and interact with matches
- **Flags**: Display received flags and reviews
- **Profile**: Manage user profile

### Key Features
- **User Profiles**: Name, age, bio, interests (max 10)
- **Verification**: Admin-controlled user verification
- **Matching**: Smart contract-based matching system
- **Flagging**: Post-date feedback system
- **Privacy**: Flags hidden until mutual approval

## 🚀 Getting Started

### Prerequisites

1. **Rose Wallet**: Install [Rose Wallet](https://rosewallet.io) browser extension
2. **Node.js**: Version 16 or higher
3. **npm**: Package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flagmedaddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SAPPHIRE_RPC=https://testnet.sapphire.oasis.dev
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
   ```

4. **Deploy the smart contract**
   ```bash
   # Compile the contract
   npx hardhat compile
   
   # Deploy to Oasis Sapphire testnet
   npx hardhat run scripts/deploy.js --network sapphire-testnet
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Smart Contract Deployment

### Using Hardhat (Recommended)

1. **Install Hardhat**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Initialize Hardhat**
   ```bash
   npx hardhat init
   ```

3. **Configure Hardhat**
   Create `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   
   module.exports = {
     solidity: "0.8.19",
     networks: {
       sapphireTestnet: {
         url: "https://testnet.sapphire.oasis.dev",
         accounts: [process.env.PRIVATE_KEY],
         chainId: 23295
       }
     }
   };
   ```

4. **Deploy the contract**
   ```bash
   npx hardhat run scripts/deploy.js --network sapphireTestnet
   ```

### Manual Deployment

1. **Get testnet ROSE tokens** from the [Oasis Faucet](https://faucet.testnet.oasis.dev/)
2. **Use Remix IDE** or your preferred Solidity compiler
3. **Deploy to Sapphire testnet** at `https://testnet.sapphire.oasis.dev`

## 📱 Usage

### 1. Connect Wallet
- Click "Connect Rose Wallet"
- Approve the connection in your Rose Wallet
- Switch to Sapphire testnet if prompted

### 2. Create Profile
- Fill in your name, age, bio, and interests
- Submit your profile for verification
- Wait for admin verification

### 3. Get Matched
- Once verified, you'll be matched with other users
- View match profiles and details

### 4. Submit Flags
- After going on a date, submit a flag
- Choose red flag (bad) or green flag (good)
- Write a review (max 100 characters)
- Wait for mutual approval

### 5. View Flags
- Check your received flags in the Flags tab
- Flags are only visible after both users approve

## 🔒 Security Features

- **Smart Contract Verification**: All user data stored on blockchain
- **Privacy Controls**: Flags hidden until mutual approval
- **Age Verification**: Minimum age requirement (18+)
- **Content Limits**: Bio (500 chars), interests (10 max), reviews (100 chars)
- **Admin Controls**: User verification system

## 🛠️ Development

### Project Structure
```
flagmedaddy/
├── contracts/
│   └── DatingApp.sol          # Main smart contract
├── components/
│   ├── WalletConnect.js       # Rose Wallet integration
│   ├── UserRegistration.js    # Profile creation
│   ├── Navigation.js          # App navigation
│   ├── Matches.js             # Match management
│   ├── Flags.js               # Flag display
│   └── Profile.js             # Profile management
├── contexts/
│   └── AppContext.js          # React context for state
├── utils/
│   └── oasis.js               # Oasis Sapphire utilities
├── pages/
│   └── index.js               # Main app page
└── README.md
```

### Key Dependencies
- `ethers`: Ethereum library for blockchain interaction
- `@headlessui/react`: UI components
- `@heroicons/react`: Icons

## 🌐 Network Configuration

### Oasis Sapphire Testnet
- **RPC URL**: `https://testnet.sapphire.oasis.dev`
- **Chain ID**: `23295` (0x5aff)
- **Currency**: ROSE
- **Explorer**: `https://testnet.explorer.sapphire.oasis.dev`

### Mainnet (Production)
- **RPC URL**: `https://sapphire.oasis.dev`
- **Chain ID**: `23294` (0x5afe)
- **Currency**: ROSE
- **Explorer**: `https://explorer.sapphire.oasis.dev`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the code comments and this README
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Community**: Join the Oasis Discord for blockchain support

## ⚠️ Disclaimer

This is a demo application for educational purposes. Use at your own risk. The smart contract has not been audited for production use.

## 🔮 Future Enhancements

- [ ] Photo uploads with IPFS
- [ ] Advanced matching algorithms
- [ ] Chat functionality
- [ ] Mobile app
- [ ] Premium features
- [ ] Community governance
- [ ] Reputation system
- [ ] Event organization
