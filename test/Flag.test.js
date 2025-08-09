const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Flag Smart Contract", function () {
  let flag;
  let owner, user1, user2, user3;
  
  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy Flag contract
    const Flag = await ethers.getContractFactory("Flag");
    flag = await Flag.deploy();
    await flag.waitForDeployment();
    
    // Verify users
    await flag.connect(owner).verifyUser(user1.address);
    await flag.connect(owner).verifyUser(user2.address);
    await flag.connect(owner).verifyUser(user3.address);
    
    // Create matches
    await flag.connect(owner).createMatch(user1.address, user2.address);
    await flag.connect(owner).createMatch(user1.address, user3.address);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await flag.owner()).to.equal(owner.address);
    });

    it("Should initialize with default categories", async function () {
      const categories = await flag.getFlagCategories();
      expect(categories.length).to.be.greaterThan(0);
      expect(categories).to.include("behavior");
      expect(categories).to.include("safety");
      expect(categories).to.include("kindness");
    });

    it("Should verify owner by default", async function () {
      expect(await flag.isVerifiedUser(owner.address)).to.be.true;
    });
  });

  describe("User Management", function () {
    it("Should verify users", async function () {
      const [, , , , newUser] = await ethers.getSigners();
      
      await flag.connect(owner).verifyUser(newUser.address);
      expect(await flag.isVerifiedUser(newUser.address)).to.be.true;
      
      const reputation = await flag.userReputation(newUser.address);
      expect(reputation).to.equal(50); // Starting reputation
    });

    it("Should create matches between users", async function () {
      expect(await flag.hasMatched(user1.address, user2.address)).to.be.true;
      expect(await flag.hasMatched(user2.address, user1.address)).to.be.true;
    });

    it("Should prevent non-owner from verifying users", async function () {
      const [, , , , newUser] = await ethers.getSigners();
      
      await expect(
        flag.connect(user1).verifyUser(newUser.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Green Flag Submission", function () {
    it("Should submit green flags successfully", async function () {
      const tx = await flag.connect(user1).submitFlag(
        user2.address,
        false, // Green flag
        "Great conversation and very respectful!",
        "communication",
        0 // No severity for green flags
      );
      
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
      
      // Check flag was stored
      const stats = await flag.getFlagStatistics(user2.address);
      expect(stats.totalFlags).to.equal(1);
      expect(stats.greenFlags).to.equal(0); // Not visible yet
      expect(stats.pendingFlags).to.equal(1);
    });

    it("Should emit FlagSubmitted event for green flags", async function () {
      await expect(
        flag.connect(user1).submitFlag(
          user2.address,
          false,
          "Wonderful person!",
          "kindness",
          0
        )
      ).to.emit(flag, "FlagSubmitted");
    });

    it("Should update reputation positively for green flags", async function () {
      const initialReputation = await flag.userReputation(user2.address);
      
      await flag.connect(user1).submitFlag(
        user2.address,
        false,
        "Amazing date!",
        "general",
        0
      );
      
      const newReputation = await flag.userReputation(user2.address);
      expect(newReputation).to.equal(initialReputation + BigInt(5));
    });
  });

  describe("Red Flag Submission", function () {
    it("Should submit red flags with severity", async function () {
      const tx = await flag.connect(user1).submitFlag(
        user2.address,
        true, // Red flag
        "Was rude to the waiter",
        "behavior",
        7 // High severity
      );
      
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
      
      const stats = await flag.getFlagStatistics(user2.address);
      expect(stats.totalFlags).to.equal(1);
      expect(stats.pendingFlags).to.equal(1);
    });

    it("Should validate severity range for red flags", async function () {
      await expect(
        flag.connect(user1).submitFlag(
          user2.address,
          true,
          "Bad behavior",
          "behavior",
          0 // Invalid severity for red flag
        )
      ).to.be.revertedWith("Red flag severity must be between 1-10");

      await expect(
        flag.connect(user1).submitFlag(
          user2.address,
          true,
          "Bad behavior",
          "behavior",
          11 // Too high severity
        )
      ).to.be.revertedWith("Red flag severity must be between 1-10");
    });

    it("Should update reputation negatively for red flags", async function () {
      const initialReputation = await flag.userReputation(user2.address);
      
      await flag.connect(user1).submitFlag(
        user2.address,
        true,
        "Inappropriate behavior",
        "behavior",
        8 // High severity
      );
      
      const newReputation = await flag.userReputation(user2.address);
      expect(newReputation).to.equal(initialReputation - BigInt(16)); // 8 * 2 = 16
    });

    it("Should not let reputation go below zero", async function () {
      // Create additional matches for user3
      await flag.connect(owner).createMatch(user2.address, user3.address);
      
      // Submit multiple high-severity red flags
      await flag.connect(user1).submitFlag(user3.address, true, "Bad 1", "behavior", 10);
      await flag.connect(user2).submitFlag(user3.address, true, "Bad 2", "behavior", 10);
      await flag.connect(user1).submitFlag(user3.address, true, "Bad 3", "behavior", 10);
      
      const reputation = await flag.userReputation(user3.address);
      expect(reputation).to.equal(0);
    });
  });

  describe("Encrypted Flags", function () {
    it("Should submit encrypted flags", async function () {
      const encryptedReview = ethers.hexlify(ethers.toUtf8Bytes("encrypted_sensitive_info"));
      
      const tx = await flag.connect(user1).submitEncryptedFlag(
        user2.address,
        true,
        encryptedReview,
        "safety",
        9
      );
      
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
      
      // Should emit encrypted flag event
      expect(tx)
        .to.emit(flag, "EncryptedFlagSubmitted");
    });

    it("Should validate encrypted review length", async function () {
      const tooLong = ethers.hexlify(new Uint8Array(501)); // 501 bytes
      
      await expect(
        flag.connect(user1).submitEncryptedFlag(
          user2.address,
          false,
          tooLong,
          "general",
          0
        )
      ).to.be.revertedWith("Encrypted review too long");
    });
  });

  describe("Anonymous Flags", function () {
    it("Should submit anonymous flags", async function () {
      const tx = await flag.connect(user1).submitAnonymousFlag(
        user2.address,
        false,
        "Anonymous positive feedback",
        "kindness",
        0
      );
      
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
      
      // Should emit anonymous flag event
      await expect(tx)
        .to.emit(flag, "AnonymousFlagSubmitted");
    });

    it("Should hide sender identity in anonymous flags", async function () {
      await flag.connect(user1).submitAnonymousFlag(
        user2.address,
        false,
        "Anonymous feedback",
        "general",
        0
      );
      
      const flags = await flag.userFlags(user2.address, 0);
      expect(flags.from).to.equal("0x0000000000000000000000000000000000000000");
      expect(flags.isEncrypted).to.be.true;
    });
  });

  describe("Flag Approval", function () {
    let flagId;

    beforeEach(async function () {
      const tx = await flag.connect(user1).submitFlag(
        user2.address,
        false,
        "Test flag for approval",
        "general",
        0
      );
      
      const receipt = await tx.wait();
      // Extract flag ID from event logs
      const event = receipt.logs.find(log => {
        try {
          const parsed = flag.interface.parseLog(log);
          return parsed.name === "FlagSubmitted";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = flag.interface.parseLog(event);
        flagId = parsed.args.flagId;
      }
    });

    it("Should approve flags", async function () {
      await flag.connect(user2).approveFlag(flagId);
      
      const stats = await flag.getFlagStatistics(user2.address);
      expect(stats.visibleFlags).to.equal(1);
      expect(stats.greenFlags).to.equal(1);
      expect(stats.pendingFlags).to.equal(0);
    });

    it("Should emit FlagApproved event", async function () {
      await expect(
        flag.connect(user2).approveFlag(flagId)
      ).to.emit(flag, "FlagApproved")
       .withArgs(user2.address, flagId, user2.address);
    });

    it("Should only allow flag recipient to approve", async function () {
      await expect(
        flag.connect(user1).approveFlag(flagId)
      ).to.be.revertedWith("Can only approve flags about yourself");
    });

    it("Should prevent double approval", async function () {
      await flag.connect(user2).approveFlag(flagId);
      
      await expect(
        flag.connect(user2).approveFlag(flagId)
      ).to.be.revertedWith("Flag already approved");
    });
  });

  describe("Flag Categories", function () {
    it("Should validate flag categories", async function () {
      await expect(
        flag.connect(user1).submitFlag(
          user2.address,
          false,
          "Test flag",
          "invalid_category",
          0
        )
      ).to.be.revertedWith("Invalid flag category");
    });

    it("Should allow owner to add new categories", async function () {
      await flag.connect(owner).addFlagCategory("new_category");
      
      const categories = await flag.getFlagCategories();
      expect(categories).to.include("new_category");
    });

    it("Should prevent adding duplicate categories", async function () {
      await expect(
        flag.connect(owner).addFlagCategory("behavior")
      ).to.be.revertedWith("Category already exists");
    });
  });

  describe("Flag Statistics", function () {
    beforeEach(async function () {
      // Create additional match for user3 to user2
      await flag.connect(owner).createMatch(user3.address, user2.address);
      
      // Submit various flags
      const tx1 = await flag.connect(user1).submitFlag(user2.address, false, "Green 1", "kindness", 0);
      const tx2 = await flag.connect(user1).submitFlag(user2.address, true, "Red 1", "behavior", 5);
      const tx3 = await flag.connect(user3).submitFlag(user2.address, false, "Green 2", "communication", 0);
      
      // Get flag IDs and approve some
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find(log => {
        try {
          const parsed = flag.interface.parseLog(log);
          return parsed.name === "FlagSubmitted";
        } catch {
          return false;
        }
      });
      
      if (event1) {
        const parsed = flag.interface.parseLog(event1);
        await flag.connect(user2).approveFlag(parsed.args.flagId);
      }
    });

    it("Should return correct flag statistics", async function () {
      const stats = await flag.getFlagStatistics(user2.address);
      
      expect(stats.totalFlags).to.equal(3);
      expect(stats.visibleFlags).to.equal(1);
      expect(stats.greenFlags).to.equal(1);
      expect(stats.redFlags).to.equal(0);
      expect(stats.pendingFlags).to.equal(2);
    });

    it("Should calculate average rating correctly", async function () {
      // Approve all flags to see rating calculation
      const allFlags = [];
      for (let i = 0; i < 3; i++) {
        const flagData = await flag.userFlags(user2.address, i);
        allFlags.push(flagData.flagId);
      }
      
      // Approve all flags
      for (const flagId of allFlags) {
        try {
          await flag.connect(user2).approveFlag(flagId);
        } catch (e) {
          // Flag might already be approved
        }
      }
      
      const stats = await flag.getFlagStatistics(user2.address);
      expect(stats.averageRating).to.be.greaterThan(0);
    });
  });

  describe("Privacy Features", function () {
    it("Should generate encryption seeds", async function () {
      const seed1 = await flag.generateEncryptionSeed();
      const seed2 = await flag.generateEncryptionSeed();
      
      expect(seed1).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(seed2).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should encrypt flag reviews", async function () {
      const review = "Sensitive information";
      const seed = await flag.generateEncryptionSeed();
      
      const encrypted = await flag.encryptFlagReview(review, seed);
      expect(encrypted).to.not.equal("0x");
      expect(encrypted.length).to.be.greaterThan(2);
    });

    it("Should control access to flags by ID", async function () {
      const tx = await flag.connect(user1).submitFlag(
        user2.address,
        false,
        "Private flag",
        "general",
        0
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = flag.interface.parseLog(log);
          return parsed.name === "FlagSubmitted";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = flag.interface.parseLog(event);
        const flagId = parsed.args.flagId;
        
        // Recipient should be able to access
        const flag1 = await flag.getFlagById(flagId, user2.address);
        expect(flag1.review).to.equal("Private flag");
        
        // Sender should be able to access
        const flag2 = await flag.getFlagById(flagId, user1.address);
        expect(flag2.review).to.equal("Private flag");
        
        // Unauthorized user should be denied
        await expect(
          flag.getFlagById(flagId, user3.address)
        ).to.be.revertedWith("Access denied");
      }
    });
  });

  describe("Access Control", function () {
    it("Should prevent unverified users from submitting flags", async function () {
      const [, , , , unverified] = await ethers.getSigners();
      
      await expect(
        flag.connect(unverified).submitFlag(
          user1.address,
          false,
          "Test",
          "general",
          0
        )
      ).to.be.revertedWith("User must be verified");
    });

    it("Should prevent flagging users you haven't matched with", async function () {
      const [, , , , other] = await ethers.getSigners();
      await flag.connect(owner).verifyUser(other.address);
      
      await expect(
        flag.connect(user1).submitFlag(
          other.address,
          false,
          "Test",
          "general",
          0
        )
      ).to.be.revertedWith("Can only flag users you have matched with");
    });

    it("Should prevent self-flagging", async function () {
      await expect(
        flag.connect(user1).submitFlag(
          user1.address,
          false,
          "Self flag",
          "general",
          0
        )
      ).to.be.revertedWith("Cannot flag yourself");
    });
  });

  describe("Contract Statistics", function () {
    it("Should track contract-wide statistics", async function () {
      await flag.connect(user1).submitFlag(user2.address, false, "Test 1", "general", 0);
      await flag.connect(user1).submitFlag(user2.address, true, "Test 2", "behavior", 5);
      
      const [totalSubmitted, totalApproved, categoriesCount] = await flag.getContractStats();
      
      expect(totalSubmitted).to.equal(2);
      expect(totalApproved).to.equal(0); // None approved yet
      expect(categoriesCount).to.be.greaterThan(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty reviews", async function () {
      await expect(
        flag.connect(user1).submitFlag(
          user2.address,
          false,
          "",
          "general",
          0
        )
      ).to.be.revertedWith("Review cannot be empty");
    });

    it("Should handle long reviews", async function () {
      const longReview = "a".repeat(201);
      
      await expect(
        flag.connect(user1).submitFlag(
          user2.address,
          false,
          longReview,
          "general",
          0
        )
      ).to.be.revertedWith("Review too long");
    });

    it("Should handle non-existent flag IDs", async function () {
      const fakeId = "0x1234567890123456789012345678901234567890123456789012345678901234";
      
      await expect(
        flag.getFlagById(fakeId, user1.address)
      ).to.be.revertedWith("Flag not found");
    });
  });
});
