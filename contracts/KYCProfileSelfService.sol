// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract KYCProfileSelfService {
    // Public profile data (visible to everyone)
    struct PublicProfile {
        string username;
        uint256 age;
        string gender;
        bool isKYCVerified;
        bool isActive;
        uint256 createdAt;
    }

    // Private profile data (only accessible by owner or authorized parties)
    struct PrivateProfile {
        string fullName;
        string bio;
        string[] interests;
        uint256 monthlySalary;
        string profileImageHash;
        string kycDocumentHash;
        string encryptedPersonalData; // Additional sensitive data
    }

    // KYC verification data (confidential)
    struct KYCData {
        string documentType; // "passport", "driver_license", etc.
        string documentNumber; // Encrypted
        string verificationProvider;
        uint256 verificationTimestamp;
        bool isVerified;
    }

    // Mappings
    mapping(address => PublicProfile) public publicProfiles;
    mapping(address => PrivateProfile) private privateProfiles;
    mapping(address => KYCData) private kycData;
    mapping(address => bool) public isRegistered;
    mapping(address => mapping(address => bool)) private authorizedViewers;

    // Array to store all registered users for discovery
    address[] public registeredUsers;

    // Authorized KYC verifiers (for manual verification)
    mapping(address => bool) public authorizedVerifiers;
    address public owner;

    // Events
    event ProfileCreated(address indexed user, string username, uint256 timestamp);
    event KYCVerified(address indexed user, address indexed verifier, uint256 timestamp);
    event ProfileUpdated(address indexed user, uint256 timestamp);
    event ViewerAuthorized(address indexed user, address indexed viewer, uint256 timestamp);
    event ViewerRevoked(address indexed user, address indexed viewer, uint256 timestamp);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }

    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner, "Not authorized to verify KYC");
        _;
    }

    modifier onlyAuthorizedToView(address _user) {
        require(
            msg.sender == _user || 
            authorizedViewers[_user][msg.sender] || 
            msg.sender == owner,
            "Not authorized to view private data"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedVerifiers[msg.sender] = true; // Owner is default verifier
    }

    // Create user profile (SELF-SERVICE - users can create their own profiles)
    function createProfile(
        string memory _username,
        uint256 _age,
        string memory _gender,
        string memory _fullName,
        string memory _bio,
        string[] memory _interests,
        uint256 _monthlySalary,
        string memory _profileImageHash
    ) external {
        require(!isRegistered[msg.sender], "User already registered");
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(_age >= 18 && _age <= 100, "Age must be between 18 and 100");
        require(bytes(_fullName).length > 0, "Full name cannot be empty");

        // Store public profile
        publicProfiles[msg.sender] = PublicProfile({
            username: _username,
            age: _age,
            gender: _gender,
            isKYCVerified: false, // Will be set true after KYC verification
            isActive: true,
            createdAt: block.timestamp
        });

        // Store private profile (encrypted on Sapphire)
        privateProfiles[msg.sender] = PrivateProfile({
            fullName: _fullName,
            bio: _bio,
            interests: _interests,
            monthlySalary: _monthlySalary,
            profileImageHash: _profileImageHash,
            kycDocumentHash: "",
            encryptedPersonalData: ""
        });

        isRegistered[msg.sender] = true;
        registeredUsers.push(msg.sender);

        emit ProfileCreated(msg.sender, _username, block.timestamp);
    }

    // Submit KYC documents for verification (SELF-SERVICE)
    function submitKYCDocuments(
        string memory _documentType,
        string memory _encryptedDocumentNumber,
        string memory _kycDocumentHash
    ) external onlyRegistered {
        require(!publicProfiles[msg.sender].isKYCVerified, "KYC already verified");
        require(bytes(_documentType).length > 0, "Document type cannot be empty");
        require(bytes(_encryptedDocumentNumber).length > 0, "Document number cannot be empty");
        require(bytes(_kycDocumentHash).length > 0, "Document hash cannot be empty");

        // Store KYC data (confidential) - marked as pending verification
        kycData[msg.sender] = KYCData({
            documentType: _documentType,
            documentNumber: _encryptedDocumentNumber,
            verificationProvider: "self_service_pending",
            verificationTimestamp: block.timestamp,
            isVerified: false // Will be verified by authorized verifier
        });

        // Update private profile with KYC document hash
        privateProfiles[msg.sender].kycDocumentHash = _kycDocumentHash;

        // For demo purposes, auto-verify KYC (in production, this would require manual verification)
        _autoVerifyKYC(msg.sender);
    }

    // Auto-verify KYC for demo purposes (in production, remove this and use manual verification)
    function _autoVerifyKYC(address _user) internal {
        // Update KYC data
        kycData[_user].isVerified = true;
        kycData[_user].verificationProvider = "auto_verified_demo";
        
        // Update public profile verification status
        publicProfiles[_user].isKYCVerified = true;

        emit KYCVerified(_user, address(this), block.timestamp);
    }

    // Manual KYC verification by authorized verifiers
    function verifyKYC(address _user) external onlyAuthorizedVerifier {
        require(isRegistered[_user], "User not registered");
        require(!publicProfiles[_user].isKYCVerified, "KYC already verified");
        require(bytes(kycData[_user].documentType).length > 0, "No KYC documents submitted");

        // Update KYC verification
        kycData[_user].isVerified = true;
        kycData[_user].verificationProvider = "manual_verification";
        kycData[_user].verificationTimestamp = block.timestamp;
        
        // Update public profile verification status
        publicProfiles[_user].isKYCVerified = true;

        emit KYCVerified(_user, msg.sender, block.timestamp);
    }

    // Get public profile (accessible by anyone)
    function getPublicProfile(address _user) external view returns (
        string memory username,
        uint256 age,
        string memory gender,
        bool isKYCVerified,
        bool isActive,
        uint256 createdAt
    ) {
        require(isRegistered[_user], "User not registered");
        PublicProfile memory profile = publicProfiles[_user];
        
        return (
            profile.username,
            profile.age,
            profile.gender,
            profile.isKYCVerified,
            profile.isActive,
            profile.createdAt
        );
    }

    // Get private profile (only authorized viewers)
    function getPrivateProfile(address _user) external view onlyAuthorizedToView(_user) returns (
        string memory fullName,
        string memory bio,
        string[] memory interests,
        uint256 monthlySalary,
        string memory profileImageHash
    ) {
        require(isRegistered[_user], "User not registered");
        PrivateProfile memory profile = privateProfiles[_user];
        
        return (
            profile.fullName,
            profile.bio,
            profile.interests,
            profile.monthlySalary,
            profile.profileImageHash
        );
    }

    // Get KYC data (only user or authorized parties)
    function getKYCData(address _user) external view onlyAuthorizedToView(_user) returns (
        string memory documentType,
        string memory verificationProvider,
        uint256 verificationTimestamp,
        bool isVerified
    ) {
        require(isRegistered[_user], "User not registered");
        KYCData memory kyc = kycData[_user];
        
        // Don't return encrypted document number for security
        return (
            kyc.documentType,
            kyc.verificationProvider,
            kyc.verificationTimestamp,
            kyc.isVerified
        );
    }

    // User authorizes someone to view their private data
    function authorizeViewer(address _viewer) external onlyRegistered {
        require(_viewer != address(0), "Invalid viewer address");
        require(_viewer != msg.sender, "Cannot authorize yourself");
        
        authorizedViewers[msg.sender][_viewer] = true;
        emit ViewerAuthorized(msg.sender, _viewer, block.timestamp);
    }

    // User revokes viewer authorization
    function revokeViewer(address _viewer) external onlyRegistered {
        authorizedViewers[msg.sender][_viewer] = false;
        emit ViewerRevoked(msg.sender, _viewer, block.timestamp);
    }

    // Check if viewer is authorized
    function isAuthorizedViewer(address _user, address _viewer) external view returns (bool) {
        return authorizedViewers[_user][_viewer];
    }

    // Update profile (user can update certain fields)
    function updateProfile(
        string memory _bio,
        string[] memory _interests,
        string memory _profileImageHash
    ) external onlyRegistered {
        require(bytes(_bio).length > 0, "Bio cannot be empty");
        
        privateProfiles[msg.sender].bio = _bio;
        privateProfiles[msg.sender].interests = _interests;
        if (bytes(_profileImageHash).length > 0) {
            privateProfiles[msg.sender].profileImageHash = _profileImageHash;
        }

        emit ProfileUpdated(msg.sender, block.timestamp);
    }

    // Deactivate profile
    function deactivateProfile() external onlyRegistered {
        publicProfiles[msg.sender].isActive = false;
    }

    // Reactivate profile
    function reactivateProfile() external onlyRegistered {
        publicProfiles[msg.sender].isActive = true;
    }

    // Get total number of registered users
    function getTotalUsers() external view returns (uint256) {
        return registeredUsers.length;
    }

    // Get registered users for discovery (only public data)
    function getUsers(uint256 _start, uint256 _limit) external view returns (
        address[] memory addresses,
        string[] memory usernames,
        bool[] memory kycStatuses,
        bool[] memory activeStatuses
    ) {
        require(_start < registeredUsers.length, "Start index out of bounds");
        
        uint256 end = _start + _limit;
        if (end > registeredUsers.length) {
            end = registeredUsers.length;
        }
        
        uint256 length = end - _start;
        addresses = new address[](length);
        usernames = new string[](length);
        kycStatuses = new bool[](length);
        activeStatuses = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            address userAddr = registeredUsers[_start + i];
            addresses[i] = userAddr;
            usernames[i] = publicProfiles[userAddr].username;
            kycStatuses[i] = publicProfiles[userAddr].isKYCVerified;
            activeStatuses[i] = publicProfiles[userAddr].isActive;
        }
        
        return (addresses, usernames, kycStatuses, activeStatuses);
    }

    // Check if user exists and is active
    function isUserActiveAndVerified(address _user) external view returns (bool) {
        return isRegistered[_user] && 
               publicProfiles[_user].isActive && 
               publicProfiles[_user].isKYCVerified;
    }

    // Admin functions
    function addAuthorizedVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = true;
    }

    function removeAuthorizedVerifier(address _verifier) external onlyOwner {
        require(_verifier != owner, "Cannot remove owner as verifier");
        authorizedVerifiers[_verifier] = false;
    }

    // Emergency functions
    function emergencyDeactivateUser(address _user) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        publicProfiles[_user].isActive = false;
    }
}
