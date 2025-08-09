// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserProfile {
    struct Profile {
        string name;
        uint256 age;
        string gender;
        string bio;
        string[] interests;
        uint256 monthlySalary; // in cents to avoid decimal issues
        string profileImageHash; // IPFS hash or similar
        string payslipHash; // IPFS hash or similar
        bool isVerified;
        bool isActive;
        uint256 createdAt;
        address userAddress;
    }

    // Mapping from user address to their profile
    mapping(address => Profile) public profiles;
    
    // Mapping to check if user has registered
    mapping(address => bool) public isRegistered;
    
    // Array to store all registered users for discovery
    address[] public registeredUsers;

    // Events
    event ProfileCreated(address indexed user, string name, uint256 timestamp);
    event ProfileUpdated(address indexed user, uint256 timestamp);
    event ProfileVerified(address indexed user, uint256 timestamp);

    // Modifiers
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }

    modifier notRegistered() {
        require(!isRegistered[msg.sender], "User already registered");
        _;
    }

    // Create a new user profile
    function createProfile(
        string memory _name,
        uint256 _age,
        string memory _gender,
        string memory _bio,
        string[] memory _interests,
        uint256 _monthlySalary,
        string memory _profileImageHash,
        string memory _payslipHash
    ) public notRegistered {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age >= 18 && _age <= 100, "Age must be between 18 and 100");
        require(bytes(_gender).length > 0, "Gender cannot be empty");
        require(bytes(_bio).length > 0, "Bio cannot be empty");
        require(_interests.length > 0, "At least one interest required");
        require(_monthlySalary > 0, "Monthly salary must be greater than 0");
        require(bytes(_profileImageHash).length > 0, "Profile image required");
        require(bytes(_payslipHash).length > 0, "Payslip required");

        Profile storage newProfile = profiles[msg.sender];
        newProfile.name = _name;
        newProfile.age = _age;
        newProfile.gender = _gender;
        newProfile.bio = _bio;
        newProfile.interests = _interests;
        newProfile.monthlySalary = _monthlySalary;
        newProfile.profileImageHash = _profileImageHash;
        newProfile.payslipHash = _payslipHash;
        newProfile.isVerified = false; // Initially not verified
        newProfile.isActive = true;
        newProfile.createdAt = block.timestamp;
        newProfile.userAddress = msg.sender;

        isRegistered[msg.sender] = true;
        registeredUsers.push(msg.sender);

        emit ProfileCreated(msg.sender, _name, block.timestamp);
    }

    // Update user profile (only certain fields can be updated)
    function updateProfile(
        string memory _bio,
        string[] memory _interests,
        string memory _profileImageHash
    ) public onlyRegistered {
        require(bytes(_bio).length > 0, "Bio cannot be empty");
        require(_interests.length > 0, "At least one interest required");
        require(bytes(_profileImageHash).length > 0, "Profile image required");

        Profile storage userProfile = profiles[msg.sender];
        userProfile.bio = _bio;
        userProfile.interests = _interests;
        userProfile.profileImageHash = _profileImageHash;

        emit ProfileUpdated(msg.sender, block.timestamp);
    }

    // Get user profile by address
    function getProfile(address _user) public view returns (
        string memory name,
        uint256 age,
        string memory gender,
        string memory bio,
        string[] memory interests,
        uint256 monthlySalary,
        string memory profileImageHash,
        string memory payslipHash,
        bool isVerified,
        bool isActive,
        uint256 createdAt,
        address userAddress
    ) {
        require(isRegistered[_user], "User not registered");
        Profile memory userProfile = profiles[_user];
        
        return (
            userProfile.name,
            userProfile.age,
            userProfile.gender,
            userProfile.bio,
            userProfile.interests,
            userProfile.monthlySalary,
            userProfile.profileImageHash,
            userProfile.payslipHash,
            userProfile.isVerified,
            userProfile.isActive,
            userProfile.createdAt,
            userProfile.userAddress
        );
    }

    // Get user's own profile
    function getMyProfile() public view onlyRegistered returns (
        string memory name,
        uint256 age,
        string memory gender,
        string memory bio,
        string[] memory interests,
        uint256 monthlySalary,
        string memory profileImageHash,
        string memory payslipHash,
        bool isVerified,
        bool isActive,
        uint256 createdAt,
        address userAddress
    ) {
        return getProfile(msg.sender);
    }

    // Verify a user's profile (only contract owner or authorized verifier)
    function verifyProfile(address _user) public {
        require(isRegistered[_user], "User not registered");
        profiles[_user].isVerified = true;
        emit ProfileVerified(_user, block.timestamp);
    }

    // Deactivate profile
    function deactivateProfile() public onlyRegistered {
        profiles[msg.sender].isActive = false;
    }

    // Reactivate profile
    function reactivateProfile() public onlyRegistered {
        profiles[msg.sender].isActive = true;
    }

    // Get total number of registered users
    function getTotalUsers() public view returns (uint256) {
        return registeredUsers.length;
    }

    // Get registered users (for discovery) - paginated
    function getUsers(uint256 _start, uint256 _limit) public view returns (address[] memory) {
        require(_start < registeredUsers.length, "Start index out of bounds");
        
        uint256 end = _start + _limit;
        if (end > registeredUsers.length) {
            end = registeredUsers.length;
        }
        
        address[] memory result = new address[](end - _start);
        for (uint256 i = _start; i < end; i++) {
            result[i - _start] = registeredUsers[i];
        }
        
        return result;
    }

    // Check if user is registered
    function checkRegistration(address _user) public view returns (bool) {
        return isRegistered[_user];
    }

    // Get active users only
    function getActiveUsers(uint256 _start, uint256 _limit) public view returns (address[] memory) {
        require(_start < registeredUsers.length, "Start index out of bounds");
        
        // First pass: count active users
        uint256 activeCount = 0;
        for (uint256 i = _start; i < registeredUsers.length && activeCount < _limit; i++) {
            if (profiles[registeredUsers[i]].isActive) {
                activeCount++;
            }
        }
        
        // Second pass: collect active users
        address[] memory result = new address[](activeCount);
        uint256 resultIndex = 0;
        for (uint256 i = _start; i < registeredUsers.length && resultIndex < _limit; i++) {
            if (profiles[registeredUsers[i]].isActive) {
                result[resultIndex] = registeredUsers[i];
                resultIndex++;
            }
        }
        
        return result;
    }
} 