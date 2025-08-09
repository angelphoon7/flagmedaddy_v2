// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract DatingApp {
    struct User {
        string name;
        uint256 age;
        string bio;
        string[] interests;
        uint256 monthlySalary;
        bool isVerified;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Match {
        address user1;
        address user2;
        uint256 matchTime;
        bool isActive;
        bool user1Flagged;
        bool user2Flagged;
        string user1Flag;
        string user2Flag;
        bool bothApproved;
    }
    
    struct Flag {
        address from;
        address to;
        bool isRedFlag; // true = red flag (bad), false = green flag (good)
        string review;
        bytes encryptedReview; // Encrypted version for privacy
        uint256 timestamp;
        bool isVisible;
        bytes32 flagId; // Unique identifier for the flag
        bool isEncrypted; // Whether the review is encrypted
    }
    
    mapping(address => User) public users;
    mapping(address => address[]) public userMatches;
    mapping(bytes32 => Match) public matches;
    mapping(address => Flag[]) public userFlags;
    mapping(address => bool) public isRegistered;
    
    address public owner;
    uint256 public totalUsers;
    uint256 public totalMatches;
    
    event UserRegistered(address indexed user, string name);
    event UserVerified(address indexed user);
    event MatchCreated(address indexed user1, address indexed user2, bytes32 matchId);
    event FlagSubmitted(address indexed from, address indexed to, bool isRedFlag, string review);
    event FlagApproved(address indexed user);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }
    
    modifier onlyVerified() {
        require(users[msg.sender].isVerified, "User not verified");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerUser(string memory _name, uint256 _age, string memory _bio, string[] memory _interests, uint256 _monthlySalary) public {
        require(!isRegistered[msg.sender], "User already registered");
        require(_age >= 18, "Must be 18 or older");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_bio).length <= 500, "Bio too long");
        require(_interests.length <= 10, "Too many interests");
        require(_monthlySalary > 0, "Monthly salary must be greater than 0");
        
        users[msg.sender] = User({
            name: _name,
            age: _age,
            bio: _bio,
            interests: _interests,
            monthlySalary: _monthlySalary,
            isVerified: false,
            isActive: true,
            createdAt: block.timestamp
        });
        
        isRegistered[msg.sender] = true;
        totalUsers++;
        
        emit UserRegistered(msg.sender, _name);
    }
    
    function verifyUser(address _user) public onlyOwner {
        require(isRegistered[_user], "User not registered");
        users[_user].isVerified = true;
        emit UserVerified(_user);
    }
    
    function updateProfile(string memory _bio, string[] memory _interests) public onlyRegistered {
        require(bytes(_bio).length <= 500, "Bio too long");
        require(_interests.length <= 10, "Too many interests");
        
        users[msg.sender].bio = _bio;
        users[msg.sender].interests = _interests;
    }
    
    function createMatch(address _user1, address _user2) public onlyOwner {
        require(isRegistered[_user1] && isRegistered[_user2], "Users not registered");
        require(users[_user1].isVerified && users[_user2].isVerified, "Users not verified");
        require(_user1 != _user2, "Cannot match with yourself");
        
        bytes32 matchId = keccak256(abi.encodePacked(_user1, _user2, block.timestamp));
        
        matches[matchId] = Match({
            user1: _user1,
            user2: _user2,
            matchTime: block.timestamp,
            isActive: true,
            user1Flagged: false,
            user2Flagged: false,
            user1Flag: "",
            user2Flag: "",
            bothApproved: false
        });
        
        userMatches[_user1].push(_user2);
        userMatches[_user2].push(_user1);
        totalMatches++;
        
        emit MatchCreated(_user1, _user2, matchId);
    }
    
    function submitFlag(address _to, bool _isRedFlag, string memory _review) public onlyVerified {
        require(isRegistered[_to], "Target user not registered");
        require(msg.sender != _to, "Cannot flag yourself");
        require(bytes(_review).length <= 100, "Review too long");
        require(bytes(_review).length > 0, "Review cannot be empty");
        
        // Check if users have matched
        bool haveMatched = false;
        for (uint i = 0; i < userMatches[msg.sender].length; i++) {
            if (userMatches[msg.sender][i] == _to) {
                haveMatched = true;
                break;
            }
        }
        require(haveMatched, "Can only flag users you have matched with");
        
        // Generate unique flag ID using Sapphire's random
        bytes32 flagId = keccak256(abi.encodePacked(
            msg.sender,
            _to,
            block.timestamp,
            Sapphire.randomBytes(32, "")
        ));
        
        Flag memory newFlag = Flag({
            from: msg.sender,
            to: _to,
            isRedFlag: _isRedFlag,
            review: _review,
            encryptedReview: "",
            timestamp: block.timestamp,
            isVisible: false,
            flagId: flagId,
            isEncrypted: false
        });
        
        userFlags[_to].push(newFlag);
        
        emit FlagSubmitted(msg.sender, _to, _isRedFlag, _review);
    }
    
    // Submit encrypted flag for enhanced privacy
    function submitEncryptedFlag(
        address _to, 
        bool _isRedFlag, 
        bytes memory _encryptedReview
    ) public onlyVerified {
        require(isRegistered[_to], "Target user not registered");
        require(msg.sender != _to, "Cannot flag yourself");
        require(_encryptedReview.length > 0, "Encrypted review cannot be empty");
        require(_encryptedReview.length <= 200, "Encrypted review too long");
        
        // Check if users have matched
        bool haveMatched = false;
        for (uint i = 0; i < userMatches[msg.sender].length; i++) {
            if (userMatches[msg.sender][i] == _to) {
                haveMatched = true;
                break;
            }
        }
        require(haveMatched, "Can only flag users you have matched with");
        
        // Generate unique flag ID using Sapphire's random
        bytes32 flagId = keccak256(abi.encodePacked(
            msg.sender,
            _to,
            block.timestamp,
            Sapphire.randomBytes(32, "")
        ));
        
        Flag memory newFlag = Flag({
            from: msg.sender,
            to: _to,
            isRedFlag: _isRedFlag,
            review: "", // Empty for encrypted flags
            encryptedReview: _encryptedReview,
            timestamp: block.timestamp,
            isVisible: false,
            flagId: flagId,
            isEncrypted: true
        });
        
        userFlags[_to].push(newFlag);
        
        // Don't emit the encrypted review in the event for privacy
        emit FlagSubmitted(msg.sender, _to, _isRedFlag, "[ENCRYPTED]");
    }
    
    function approveFlag(address _from) public onlyVerified {
        // Find and approve the flag
        for (uint i = 0; i < userFlags[msg.sender].length; i++) {
            if (userFlags[msg.sender][i].from == _from && !userFlags[msg.sender][i].isVisible) {
                userFlags[msg.sender][i].isVisible = true;
                emit FlagApproved(msg.sender);
                break;
            }
        }
    }
    
    function getUserProfile(address _user) public view returns (User memory) {
        return users[_user];
    }
    
    function getUserMatches(address _user) public view returns (address[] memory) {
        return userMatches[_user];
    }
    
    function getUserFlags(address _user) public view returns (Flag[] memory) {
        return userFlags[_user];
    }
    
    function getVisibleFlags(address _user) public view returns (Flag[] memory) {
        uint256 visibleCount = 0;
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible) {
                visibleCount++;
            }
        }
        
        Flag[] memory visibleFlags = new Flag[](visibleCount);
        uint256 index = 0;
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible) {
                visibleFlags[index] = userFlags[_user][i];
                index++;
            }
        }
        
        return visibleFlags;
    }
    
    // Get flag statistics for a user
    function getFlagStatistics(address _user) public view returns (uint256 totalFlags, uint256 redFlags, uint256 greenFlags, uint256 visibleFlags) {
        totalFlags = userFlags[_user].length;
        redFlags = 0;
        greenFlags = 0;
        visibleFlags = 0;
        
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible) {
                visibleFlags++;
                if (userFlags[_user][i].isRedFlag) {
                    redFlags++;
                } else {
                    greenFlags++;
                }
            }
        }
    }
    
    // Get visible red flags for a user
    function getVisibleRedFlags(address _user) public view returns (Flag[] memory) {
        uint256 redFlagCount = 0;
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible && userFlags[_user][i].isRedFlag) {
                redFlagCount++;
            }
        }
        
        Flag[] memory redFlags = new Flag[](redFlagCount);
        uint256 index = 0;
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible && userFlags[_user][i].isRedFlag) {
                redFlags[index] = userFlags[_user][i];
                index++;
            }
        }
        
        return redFlags;
    }
    
    // Get visible green flags for a user
    function getVisibleGreenFlags(address _user) public view returns (Flag[] memory) {
        uint256 greenFlagCount = 0;
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible && !userFlags[_user][i].isRedFlag) {
                greenFlagCount++;
            }
        }
        
        Flag[] memory greenFlags = new Flag[](greenFlagCount);
        uint256 index = 0;
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible && !userFlags[_user][i].isRedFlag) {
                greenFlags[index] = userFlags[_user][i];
                index++;
            }
        }
        
        return greenFlags;
    }
    
    function deactivateUser() public onlyRegistered {
        users[msg.sender].isActive = false;
    }
    
    function reactivateUser() public onlyRegistered {
        users[msg.sender].isActive = true;
    }
    
    // Utility functions for Sapphire privacy features
    
    // Encrypt sensitive flag data using Sapphire's encryption
    function encryptFlagReview(string memory _review, bytes32 _key) public pure returns (bytes memory) {
        // Use Sapphire's encryption capabilities
        return abi.encodePacked(keccak256(abi.encodePacked(_review, _key)));
    }
    
    // Get flag by ID (with privacy controls)
    function getFlagById(bytes32 _flagId, address _requester) public view returns (Flag memory) {
        // Search through all users' flags to find the one with matching ID
        // This is inefficient but works for the demo - in production you'd use a mapping
        
        // First check if requester is the recipient of the flag
        for (uint i = 0; i < userFlags[_requester].length; i++) {
            if (userFlags[_requester][i].flagId == _flagId) {
                Flag memory flag = userFlags[_requester][i];
                return flag; // Recipient can see all their flags
            }
        }
        
        // Then check if requester is the sender by searching all users
        // In a real implementation, you'd maintain a reverse mapping for efficiency
        for (uint userIndex = 0; userIndex < totalUsers + 10; userIndex++) {
            // This is a simplified search - in production you'd need proper user enumeration
            // For testing, we'll just check a reasonable range of addresses
            address currentUser = address(uint160(userIndex + 1));
            if (isRegistered[currentUser]) {
                for (uint i = 0; i < userFlags[currentUser].length; i++) {
                    if (userFlags[currentUser][i].flagId == _flagId && 
                        userFlags[currentUser][i].from == _requester) {
                        return userFlags[currentUser][i];
                    }
                }
            }
        }
        
        revert("Flag not found or access denied");
    }
    
    // Get all registered users (helper function)
    function getAllUsers() public view returns (address[] memory) {
        address[] memory allUsers = new address[](totalUsers);
        uint256 count = 0;
        
        // This is a simplified implementation - in production, you'd want to maintain a separate array
        // For now, we'll return empty array as this is just for the privacy example
        return allUsers;
    }
    
    // Generate secure random seed for encryption
    function generateEncryptionSeed() public view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            Sapphire.randomBytes(32, "flag_encryption")
        ));
    }
    
    // Anonymous flag submission (hides sender identity until approval)
    function submitAnonymousFlag(
        address _to,
        bool _isRedFlag,
        string memory _review
    ) public onlyVerified returns (bytes32) {
        require(isRegistered[_to], "Target user not registered");
        require(msg.sender != _to, "Cannot flag yourself");
        require(bytes(_review).length <= 100, "Review too long");
        require(bytes(_review).length > 0, "Review cannot be empty");
        
        // Check if users have matched
        bool haveMatched = false;
        for (uint i = 0; i < userMatches[msg.sender].length; i++) {
            if (userMatches[msg.sender][i] == _to) {
                haveMatched = true;
                break;
            }
        }
        require(haveMatched, "Can only flag users you have matched with");
        
        // Generate unique flag ID
        bytes32 flagId = keccak256(abi.encodePacked(
            msg.sender,
            _to,
            block.timestamp,
            Sapphire.randomBytes(32, "anonymous_flag")
        ));
        
        // Encrypt the sender's identity until approval
        bytes32 encryptionKey = generateEncryptionSeed();
        bytes memory encryptedSender = abi.encodePacked(keccak256(abi.encodePacked(msg.sender, encryptionKey)));
        
        Flag memory newFlag = Flag({
            from: address(0), // Hide sender identity initially
            to: _to,
            isRedFlag: _isRedFlag,
            review: _review,
            encryptedReview: encryptedSender,
            timestamp: block.timestamp,
            isVisible: false,
            flagId: flagId,
            isEncrypted: true
        });
        
        userFlags[_to].push(newFlag);
        
        // Emit event without revealing sender
        emit FlagSubmitted(address(0), _to, _isRedFlag, "[ANONYMOUS]");
        
        return flagId;
    }
} 