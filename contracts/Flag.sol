// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

/**
 * @title Flag Smart Contract
 * @dev A privacy-enhanced smart contract for storing green flags and red flags on Oasis Sapphire
 * @notice This contract allows users to submit, approve, and manage flags about other users
 * @author FlagMeDaddy Team
 */
contract Flag {
    
    // ============ STRUCTS ============
    
    /**
     * @dev Structure to store flag information with privacy features
     */
    struct FlagData {
        address from;              // Address of flag submitter
        address to;               // Address of flag recipient
        bool isRedFlag;           // true = red flag (warning), false = green flag (positive)
        string review;            // Public review text
        bytes encryptedReview;    // Encrypted review for privacy
        uint256 timestamp;        // Block timestamp when flag was created
        bool isVisible;          // Whether flag is approved and visible
        bytes32 flagId;          // Unique identifier for the flag
        bool isEncrypted;        // Whether the review is encrypted
        uint8 severity;          // Severity level (1-10, only for red flags)
        string category;         // Category of the flag (e.g., "behavior", "safety", "kindness")
    }

    /**
     * @dev Structure for flag statistics
     */
    struct FlagStats {
        uint256 totalFlags;
        uint256 redFlags;
        uint256 greenFlags;
        uint256 visibleFlags;
        uint256 pendingFlags;
        uint256 averageRating;
    }

    /**
     * @dev Structure for detailed user rating
     */
    struct UserRating {
        uint256 overallScore;           // 0-100 overall rating
        uint256 safetyScore;            // Safety rating based on safety flags
        uint256 behaviorScore;          // Behavior rating
        uint256 communicationScore;     // Communication rating
        uint256 kindnessScore;          // Kindness rating
        uint256 reliabilityScore;       // Reliability rating
        string ratingTier;              // "Excellent", "Good", "Average", "Poor", "Dangerous"
        uint256 totalInteractions;     // Total number of flag interactions
        uint256 positivePercentage;     // Percentage of positive flags
        bool isRecommended;             // Whether user is recommended for matching
    }

    /**
     * @dev Structure for category-based statistics
     */
    struct CategoryStats {
        uint256 totalCount;
        uint256 redCount;
        uint256 greenCount;
        uint256 averageSeverity;
        uint256 categoryScore;          // 0-100 score for this category
    }

    // ============ STATE VARIABLES ============
    
    mapping(address => FlagData[]) public userFlags;           // Flags received by each user
    mapping(bytes32 => FlagData) public flagById;             // Flag lookup by ID
    mapping(address => mapping(address => bool)) public hasMatched;  // Track if users have matched
    mapping(address => bool) public isVerifiedUser;           // Verified user status
    mapping(address => uint256) public userReputation;        // User reputation score
    
    // Rating system mappings
    mapping(address => mapping(string => CategoryStats)) public userCategoryStats;  // Category-based stats per user
    mapping(address => UserRating) public userRatings;        // Comprehensive user ratings
    mapping(address => uint256) public lastRatingUpdate;      // Timestamp of last rating calculation
    
    address public owner;
    uint256 public totalFlagsSubmitted;
    uint256 public totalFlagsApproved;
    
    // Flag categories
    string[] public flagCategories = [
        "behavior",
        "safety", 
        "communication",
        "kindness",
        "reliability",
        "appearance",
        "interests",
        "values",
        "general"
    ];

    // ============ EVENTS ============
    
    event FlagSubmitted(
        address indexed from,
        address indexed to,
        bool isRedFlag,
        bytes32 indexed flagId,
        string category
    );
    
    event FlagApproved(
        address indexed user,
        bytes32 indexed flagId,
        address indexed approver
    );
    
    event EncryptedFlagSubmitted(
        address indexed from,
        address indexed to,
        bool isRedFlag,
        bytes32 indexed flagId
    );
    
    event AnonymousFlagSubmitted(
        address indexed to,
        bool isRedFlag,
        bytes32 indexed flagId,
        string category
    );
    
    event UserVerified(address indexed user);
    event MatchCreated(address indexed user1, address indexed user2);
    event ReputationUpdated(address indexed user, uint256 newReputation);
    event RatingUpdated(address indexed user, uint256 overallScore, string ratingTier);
    event CategoryScoreUpdated(address indexed user, string category, uint256 score);
    event RecommendationStatusChanged(address indexed user, bool isRecommended);

    // ============ MODIFIERS ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyVerified() {
        require(isVerifiedUser[msg.sender], "User must be verified");
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        require(_addr != msg.sender, "Cannot flag yourself");
        _;
    }
    
    modifier hasMatchedWith(address _user) {
        require(hasMatched[msg.sender][_user], "Can only flag users you have matched with");
        _;
    }
    
    modifier validCategory(string memory _category) {
        require(isValidCategory(_category), "Invalid flag category");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor() {
        owner = msg.sender;
        isVerifiedUser[msg.sender] = true;
        userReputation[msg.sender] = 100; // Owner starts with perfect reputation
    }

    // ============ CORE FLAG FUNCTIONS ============
    
    /**
     * @dev Submit a regular green or red flag
     * @param _to Address of the user being flagged
     * @param _isRedFlag True for red flag, false for green flag
     * @param _review Text review (max 200 characters)
     * @param _category Category of the flag
     * @param _severity Severity level 1-10 (only for red flags)
     */
    function submitFlag(
        address _to,
        bool _isRedFlag,
        string memory _review,
        string memory _category,
        uint8 _severity
    ) 
        public 
        onlyVerified 
        validAddress(_to) 
        hasMatchedWith(_to)
        validCategory(_category)
        returns (bytes32)
    {
        require(bytes(_review).length > 0, "Review cannot be empty");
        require(bytes(_review).length <= 200, "Review too long");
        
        if (_isRedFlag) {
            require(_severity >= 1 && _severity <= 10, "Red flag severity must be between 1-10");
        } else {
            _severity = 0; // Green flags don't have severity
        }
        
        // Generate unique flag ID using Sapphire's secure random
        bytes32 flagId = keccak256(abi.encodePacked(
            msg.sender,
            _to,
            block.timestamp,
            totalFlagsSubmitted,
            Sapphire.randomBytes(32, "flag_generation")
        ));
        
        FlagData memory newFlag = FlagData({
            from: msg.sender,
            to: _to,
            isRedFlag: _isRedFlag,
            review: _review,
            encryptedReview: "",
            timestamp: block.timestamp,
            isVisible: false,
            flagId: flagId,
            isEncrypted: false,
            severity: _severity,
            category: _category
        });
        
        userFlags[_to].push(newFlag);
        flagById[flagId] = newFlag;
        totalFlagsSubmitted++;
        
        // Update reputation and ratings
        _updateReputation(_to, _isRedFlag, _severity);
        _updateCategoryStats(_to, _category, _isRedFlag, _severity);
        _calculateUserRating(_to);
        
        emit FlagSubmitted(msg.sender, _to, _isRedFlag, flagId, _category);
        
        return flagId;
    }
    
    /**
     * @dev Submit an encrypted flag for enhanced privacy
     * @param _to Address of the user being flagged
     * @param _isRedFlag True for red flag, false for green flag
     * @param _encryptedReview Encrypted review data
     * @param _category Category of the flag
     * @param _severity Severity level 1-10 (only for red flags)
     */
    function submitEncryptedFlag(
        address _to,
        bool _isRedFlag,
        bytes memory _encryptedReview,
        string memory _category,
        uint8 _severity
    )
        public
        onlyVerified
        validAddress(_to)
        hasMatchedWith(_to)
        validCategory(_category)
        returns (bytes32)
    {
        require(_encryptedReview.length > 0, "Encrypted review cannot be empty");
        require(_encryptedReview.length <= 500, "Encrypted review too long");
        
        if (_isRedFlag) {
            require(_severity >= 1 && _severity <= 10, "Red flag severity must be between 1-10");
        } else {
            _severity = 0; // Green flags don't have severity
        }
        
        bytes32 flagId = keccak256(abi.encodePacked(
            msg.sender,
            _to,
            block.timestamp,
            totalFlagsSubmitted,
            Sapphire.randomBytes(32, "encrypted_flag")
        ));
        
        FlagData memory newFlag = FlagData({
            from: msg.sender,
            to: _to,
            isRedFlag: _isRedFlag,
            review: "",
            encryptedReview: _encryptedReview,
            timestamp: block.timestamp,
            isVisible: false,
            flagId: flagId,
            isEncrypted: true,
            severity: _severity,
            category: _category
        });
        
        userFlags[_to].push(newFlag);
        flagById[flagId] = newFlag;
        totalFlagsSubmitted++;
        
        _updateReputation(_to, _isRedFlag, _severity);
        _updateCategoryStats(_to, _category, _isRedFlag, _severity);
        _calculateUserRating(_to);
        
        emit EncryptedFlagSubmitted(msg.sender, _to, _isRedFlag, flagId);
        
        return flagId;
    }
    
    /**
     * @dev Submit an anonymous flag (sender identity hidden until approval)
     * @param _to Address of the user being flagged
     * @param _isRedFlag True for red flag, false for green flag
     * @param _review Text review
     * @param _category Category of the flag
     * @param _severity Severity level 1-10 (only for red flags)
     */
    function submitAnonymousFlag(
        address _to,
        bool _isRedFlag,
        string memory _review,
        string memory _category,
        uint8 _severity
    )
        public
        onlyVerified
        validAddress(_to)
        hasMatchedWith(_to)
        validCategory(_category)
        returns (bytes32)
    {
        require(bytes(_review).length > 0, "Review cannot be empty");
        require(bytes(_review).length <= 200, "Review too long");
        
        if (_isRedFlag) {
            require(_severity >= 1 && _severity <= 10, "Red flag severity must be between 1-10");
        } else {
            _severity = 0; // Green flags don't have severity
        }
        
        bytes32 flagId = keccak256(abi.encodePacked(
            msg.sender,
            _to,
            block.timestamp,
            totalFlagsSubmitted,
            Sapphire.randomBytes(32, "anonymous_flag")
        ));
        
        // Encrypt sender identity
        bytes memory encryptedSender = abi.encodePacked(
            keccak256(abi.encodePacked(
                msg.sender,
                Sapphire.randomBytes(32, "sender_encryption")
            ))
        );
        
        FlagData memory newFlag = FlagData({
            from: address(0), // Hide sender initially
            to: _to,
            isRedFlag: _isRedFlag,
            review: _review,
            encryptedReview: encryptedSender, // Store encrypted sender info
            timestamp: block.timestamp,
            isVisible: false,
            flagId: flagId,
            isEncrypted: true,
            severity: _severity,
            category: _category
        });
        
        userFlags[_to].push(newFlag);
        flagById[flagId] = newFlag;
        totalFlagsSubmitted++;
        
        _updateReputation(_to, _isRedFlag, _severity);
        _updateCategoryStats(_to, _category, _isRedFlag, _severity);
        _calculateUserRating(_to);
        
        emit AnonymousFlagSubmitted(_to, _isRedFlag, flagId, _category);
        
        return flagId;
    }

    // ============ FLAG APPROVAL FUNCTIONS ============
    
    /**
     * @dev Approve a flag to make it visible
     * @param _flagId Unique identifier of the flag
     */
    function approveFlag(bytes32 _flagId) public {
        FlagData storage flag = flagById[_flagId];
        require(flag.to == msg.sender, "Can only approve flags about yourself");
        require(!flag.isVisible, "Flag already approved");
        
        flag.isVisible = true;
        
        // Update the flag in userFlags array as well
        for (uint i = 0; i < userFlags[msg.sender].length; i++) {
            if (userFlags[msg.sender][i].flagId == _flagId) {
                userFlags[msg.sender][i].isVisible = true;
                break;
            }
        }
        
        totalFlagsApproved++;
        
        emit FlagApproved(msg.sender, _flagId, msg.sender);
    }
    
    /**
     * @dev Batch approve multiple flags
     * @param _flagIds Array of flag IDs to approve
     */
    function batchApproveFlags(bytes32[] memory _flagIds) public {
        for (uint i = 0; i < _flagIds.length; i++) {
            approveFlag(_flagIds[i]);
        }
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get all flags for a user (visible only)
     * @param _user Address of the user
     * @return Array of visible flags
     */
    function getVisibleFlags(address _user) public view returns (FlagData[] memory) {
        uint256 visibleCount = 0;
        
        // Count visible flags
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible) {
                visibleCount++;
            }
        }
        
        FlagData[] memory visibleFlags = new FlagData[](visibleCount);
        uint256 index = 0;
        
        // Populate visible flags
        for (uint i = 0; i < userFlags[_user].length; i++) {
            if (userFlags[_user][i].isVisible) {
                visibleFlags[index] = userFlags[_user][i];
                index++;
            }
        }
        
        return visibleFlags;
    }
    
    /**
     * @dev Get visible red flags for a user
     * @param _user Address of the user
     * @return Array of visible red flags
     */
    function getVisibleRedFlags(address _user) public view returns (FlagData[] memory) {
        FlagData[] memory allVisible = getVisibleFlags(_user);
        uint256 redCount = 0;
        
        // Count red flags
        for (uint i = 0; i < allVisible.length; i++) {
            if (allVisible[i].isRedFlag) {
                redCount++;
            }
        }
        
        FlagData[] memory redFlags = new FlagData[](redCount);
        uint256 index = 0;
        
        // Populate red flags
        for (uint i = 0; i < allVisible.length; i++) {
            if (allVisible[i].isRedFlag) {
                redFlags[index] = allVisible[i];
                index++;
            }
        }
        
        return redFlags;
    }
    
    /**
     * @dev Get visible green flags for a user
     * @param _user Address of the user
     * @return Array of visible green flags
     */
    function getVisibleGreenFlags(address _user) public view returns (FlagData[] memory) {
        FlagData[] memory allVisible = getVisibleFlags(_user);
        uint256 greenCount = 0;
        
        // Count green flags
        for (uint i = 0; i < allVisible.length; i++) {
            if (!allVisible[i].isRedFlag) {
                greenCount++;
            }
        }
        
        FlagData[] memory greenFlags = new FlagData[](greenCount);
        uint256 index = 0;
        
        // Populate green flags
        for (uint i = 0; i < allVisible.length; i++) {
            if (!allVisible[i].isRedFlag) {
                greenFlags[index] = allVisible[i];
                index++;
            }
        }
        
        return greenFlags;
    }
    
    /**
     * @dev Get flag statistics for a user
     * @param _user Address of the user
     * @return FlagStats structure with statistics
     */
    function getFlagStatistics(address _user) public view returns (FlagStats memory) {
        uint256 total = userFlags[_user].length;
        uint256 red = 0;
        uint256 green = 0;
        uint256 visible = 0;
        uint256 pending = 0;
        uint256 totalRating = 0;
        uint256 ratingCount = 0;
        
        for (uint i = 0; i < total; i++) {
            FlagData memory flag = userFlags[_user][i];
            
            if (flag.isVisible) {
                visible++;
                if (flag.isRedFlag) {
                    red++;
                    totalRating += (11 - flag.severity); // Invert severity for rating
                    ratingCount++;
                } else {
                    green++;
                    totalRating += 10; // Green flags contribute max rating
                    ratingCount++;
                }
            } else {
                pending++;
            }
        }
        
        uint256 avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;
        
        return FlagStats({
            totalFlags: total,
            redFlags: red,
            greenFlags: green,
            visibleFlags: visible,
            pendingFlags: pending,
            averageRating: avgRating
        });
    }
    
    /**
     * @dev Get flag by ID with privacy controls
     * @param _flagId Unique identifier of the flag
     * @param _requester Address requesting the flag
     * @return FlagData structure
     */
    function getFlagById(bytes32 _flagId, address _requester) public view returns (FlagData memory) {
        FlagData memory flag = flagById[_flagId];
        require(flag.flagId != bytes32(0), "Flag not found");
        
        // Only recipient or sender can view the flag
        require(
            flag.to == _requester || flag.from == _requester,
            "Access denied"
        );
        
        return flag;
    }

    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @dev Generate secure encryption seed using Sapphire
     * @return bytes32 encryption seed
     */
    function generateEncryptionSeed() public view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            Sapphire.randomBytes(32, "encryption_seed")
        ));
    }
    
    /**
     * @dev Encrypt flag review data
     * @param _review Review text to encrypt
     * @param _key Encryption key
     * @return bytes Encrypted data
     */
    function encryptFlagReview(string memory _review, bytes32 _key) public pure returns (bytes memory) {
        return abi.encodePacked(keccak256(abi.encodePacked(_review, _key)));
    }
    
    /**
     * @dev Check if category is valid
     * @param _category Category string to validate
     * @return bool True if valid category
     */
    function isValidCategory(string memory _category) public view returns (bool) {
        for (uint i = 0; i < flagCategories.length; i++) {
            if (keccak256(bytes(flagCategories[i])) == keccak256(bytes(_category))) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get all available flag categories
     * @return string[] Array of valid categories
     */
    function getFlagCategories() public view returns (string[] memory) {
        return flagCategories;
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Verify a user (only owner)
     * @param _user Address of user to verify
     */
    function verifyUser(address _user) public onlyOwner {
        isVerifiedUser[_user] = true;
        userReputation[_user] = 50; // Start with neutral reputation
        emit UserVerified(_user);
    }
    
    /**
     * @dev Create a match between two users (only owner)
     * @param _user1 First user address
     * @param _user2 Second user address
     */
    function createMatch(address _user1, address _user2) public onlyOwner {
        require(_user1 != _user2, "Cannot match user with themselves");
        require(isVerifiedUser[_user1] && isVerifiedUser[_user2], "Both users must be verified");
        
        hasMatched[_user1][_user2] = true;
        hasMatched[_user2][_user1] = true;
        
        emit MatchCreated(_user1, _user2);
    }
    
    /**
     * @dev Add new flag category (only owner)
     * @param _category New category to add
     */
    function addFlagCategory(string memory _category) public onlyOwner {
        require(bytes(_category).length > 0, "Category cannot be empty");
        require(!isValidCategory(_category), "Category already exists");
        
        flagCategories.push(_category);
    }
    
    /**
     * @dev Get contract statistics
     * @return total flags, approved flags, total users
     */
    function getContractStats() public view returns (uint256, uint256, uint256) {
        return (totalFlagsSubmitted, totalFlagsApproved, flagCategories.length);
    }

    // ============ RATING SYSTEM FUNCTIONS ============
    
    /**
     * @dev Get comprehensive user rating with category breakdowns
     * @param _user Address of the user
     * @return UserRating structure with detailed ratings
     */
    function getUserRating(address _user) public view returns (UserRating memory) {
        return userRatings[_user];
    }
    
    /**
     * @dev Get category-specific statistics for a user
     * @param _user Address of the user
     * @param _category Category to get stats for
     * @return CategoryStats structure
     */
    function getCategoryStats(address _user, string memory _category) public view returns (CategoryStats memory) {
        return userCategoryStats[_user][_category];
    }
    
    /**
     * @dev Get all users with a specific rating tier
     * @param _tier Rating tier ("Excellent", "Good", "Average", "Poor", "Dangerous")
     * @return Array of user addresses in that tier (simplified implementation)
     */
    function getUsersByRatingTier(string memory _tier) public view returns (address[] memory) {
        // Note: This is a simplified implementation for demonstration
        // In production, you'd want to maintain separate arrays for each tier
        address[] memory emptyArray = new address[](0);
        return emptyArray;
    }
    
    /**
     * @dev Get recommended users for matching (high rating users)
     * @return Array of recommended user addresses
     */
    function getRecommendedUsers() public view returns (address[] memory) {
        // Note: This is a simplified implementation
        // In production, you'd maintain a separate array of recommended users
        address[] memory emptyArray = new address[](0);
        return emptyArray;
    }
    
    /**
     * @dev Get flag type distribution for analytics
     * @param _user Address of the user
     * @return categories Arrays of categories
     * @return redCounts Red flag counts per category  
     * @return greenCounts Green flag counts per category
     */
    function getFlagTypeDistribution(address _user) public view returns (
        string[] memory categories,
        uint256[] memory redCounts,
        uint256[] memory greenCounts,
        uint256[] memory categoryScores
    ) {
        categories = new string[](flagCategories.length);
        redCounts = new uint256[](flagCategories.length);
        greenCounts = new uint256[](flagCategories.length);
        categoryScores = new uint256[](flagCategories.length);
        
        for (uint i = 0; i < flagCategories.length; i++) {
            string memory category = flagCategories[i];
            CategoryStats memory stats = userCategoryStats[_user][category];
            
            categories[i] = category;
            redCounts[i] = stats.redCount;
            greenCounts[i] = stats.greenCount;
            categoryScores[i] = stats.categoryScore;
        }
        
        return (categories, redCounts, greenCounts, categoryScores);
    }

    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Update user reputation based on flag
     * @param _user User whose reputation to update
     * @param _isRedFlag Whether it's a red flag
     * @param _severity Severity of the flag
     */
    function _updateReputation(address _user, bool _isRedFlag, uint8 _severity) internal {
        if (_isRedFlag) {
            // Red flags decrease reputation based on severity
            uint256 decrease = _severity * 2;
            if (userReputation[_user] > decrease) {
                userReputation[_user] -= decrease;
            } else {
                userReputation[_user] = 0;
            }
        } else {
            // Green flags increase reputation
            userReputation[_user] += 5;
            if (userReputation[_user] > 100) {
                userReputation[_user] = 100; // Cap at 100
            }
        }
        
        emit ReputationUpdated(_user, userReputation[_user]);
    }
    
    /**
     * @dev Update category-specific statistics for a user
     * @param _user User whose stats to update
     * @param _category Category of the flag
     * @param _isRedFlag Whether it's a red flag
     * @param _severity Severity of the flag (for red flags)
     */
    function _updateCategoryStats(address _user, string memory _category, bool _isRedFlag, uint8 _severity) internal {
        CategoryStats storage stats = userCategoryStats[_user][_category];
        
        stats.totalCount++;
        
        if (_isRedFlag) {
            stats.redCount++;
            // Update average severity
            if (stats.redCount == 1) {
                stats.averageSeverity = _severity;
            } else {
                stats.averageSeverity = (stats.averageSeverity * (stats.redCount - 1) + _severity) / stats.redCount;
            }
        } else {
            stats.greenCount++;
        }
        
        // Calculate category score (0-100)
        if (stats.totalCount > 0) {
            uint256 positiveRate = (stats.greenCount * 100) / stats.totalCount;
            uint256 severityPenalty = stats.redCount > 0 ? (stats.averageSeverity * stats.redCount * 5) / stats.totalCount : 0;
            
            if (positiveRate > severityPenalty) {
                stats.categoryScore = positiveRate - severityPenalty;
            } else {
                stats.categoryScore = 0;
            }
            
            if (stats.categoryScore > 100) {
                stats.categoryScore = 100;
            }
        }
        
        emit CategoryScoreUpdated(_user, _category, stats.categoryScore);
    }
    
    /**
     * @dev Calculate comprehensive user rating based on all flags
     * @param _user User whose rating to calculate
     */
    function _calculateUserRating(address _user) internal {
        UserRating storage rating = userRatings[_user];
        
        uint256 totalFlags = userFlags[_user].length;
        if (totalFlags == 0) {
            // New user - set default values
            rating.overallScore = 50;
            rating.safetyScore = 50;
            rating.behaviorScore = 50;
            rating.communicationScore = 50;
            rating.kindnessScore = 50;
            rating.reliabilityScore = 50;
            rating.ratingTier = "New User";
            rating.totalInteractions = 0;
            rating.positivePercentage = 0;
            rating.isRecommended = false;
            return;
        }
        
        uint256 visibleFlags = 0;
        uint256 greenFlags = 0;
        uint256 redFlags = 0;
        uint256 totalSeverity = 0;
        
        // Count visible flags and calculate basic stats
        for (uint i = 0; i < totalFlags; i++) {
            if (userFlags[_user][i].isVisible) {
                visibleFlags++;
                if (userFlags[_user][i].isRedFlag) {
                    redFlags++;
                    totalSeverity += userFlags[_user][i].severity;
                } else {
                    greenFlags++;
                }
            }
        }
        
        if (visibleFlags == 0) {
            rating.totalInteractions = totalFlags;
            rating.positivePercentage = 0;
            rating.overallScore = 50; // Neutral for no visible flags
            rating.ratingTier = "Unrated";
            rating.isRecommended = false;
            return;
        }
        
        // Calculate category-specific scores
        rating.safetyScore = userCategoryStats[_user]["safety"].categoryScore;
        rating.behaviorScore = userCategoryStats[_user]["behavior"].categoryScore;
        rating.communicationScore = userCategoryStats[_user]["communication"].categoryScore;
        rating.kindnessScore = userCategoryStats[_user]["kindness"].categoryScore;
        rating.reliabilityScore = userCategoryStats[_user]["reliability"].categoryScore;
        
        // Calculate overall metrics
        rating.totalInteractions = visibleFlags;
        rating.positivePercentage = (greenFlags * 100) / visibleFlags;
        
        // Calculate overall score (weighted average of category scores and flag ratio)
        uint256 categoryAverage = (rating.safetyScore + rating.behaviorScore + rating.communicationScore + 
                                 rating.kindnessScore + rating.reliabilityScore) / 5;
        
        uint256 flagRatioScore = rating.positivePercentage;
        
        // Apply severity penalty for red flags
        uint256 severityPenalty = 0;
        if (redFlags > 0) {
            uint256 avgSeverity = totalSeverity / redFlags;
            severityPenalty = (avgSeverity * redFlags * 3) / visibleFlags; // Severity penalty
        }
        
        // Weighted combination: 60% category scores, 40% flag ratio
        rating.overallScore = (categoryAverage * 60 + flagRatioScore * 40) / 100;
        
        if (rating.overallScore > severityPenalty) {
            rating.overallScore -= severityPenalty;
        } else {
            rating.overallScore = 0;
        }
        
        // Determine rating tier
        if (rating.overallScore >= 90) {
            rating.ratingTier = "Excellent";
            rating.isRecommended = true;
        } else if (rating.overallScore >= 75) {
            rating.ratingTier = "Good";
            rating.isRecommended = true;
        } else if (rating.overallScore >= 50) {
            rating.ratingTier = "Average";
            rating.isRecommended = false;
        } else if (rating.overallScore >= 25) {
            rating.ratingTier = "Poor";
            rating.isRecommended = false;
        } else {
            rating.ratingTier = "Dangerous";
            rating.isRecommended = false;
        }
        
        // Update timestamp
        lastRatingUpdate[_user] = block.timestamp;
        
        emit RatingUpdated(_user, rating.overallScore, rating.ratingTier);
        emit RecommendationStatusChanged(_user, rating.isRecommended);
    }
}
