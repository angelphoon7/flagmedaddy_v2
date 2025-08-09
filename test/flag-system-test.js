const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Flag System Integration Tests", function () {
  let datingApp;
  let owner, user1, user2, user3;
  
  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const DatingApp = await ethers.getContractFactory("DatingApp");
    datingApp = await DatingApp.deploy();
    await datingApp.waitForDeployment();
    
    // Register users
    await datingApp.connect(user1).registerUser(
      "Alice", 
      25, 
      "Love hiking and coffee", 
      ["hiking", "coffee"], 
      5000
    );
    
    await datingApp.connect(user2).registerUser(
      "Bob", 
      28, 
      "Tech enthusiast", 
      ["coding", "gaming"], 
      7000
    );
    
    await datingApp.connect(user3).registerUser(
      "Charlie", 
      30, 
      "Artist and musician", 
      ["art", "music"], 
      4500
    );
    
    // Verify users
    await datingApp.connect(owner).verifyUser(user1.address);
    await datingApp.connect(owner).verifyUser(user2.address);
    await datingApp.connect(owner).verifyUser(user3.address);
    
    // Create matches
    await datingApp.connect(owner).createMatch(user1.address, user2.address);
    await datingApp.connect(owner).createMatch(user1.address, user3.address);
    await datingApp.connect(owner).createMatch(user2.address, user3.address);
  });

  describe("Flag Submission", function () {
    it("Should allow verified users to submit green flags", async function () {
      await datingApp.connect(user1).submitFlag(
        user2.address, 
        false, // isRedFlag = false (green flag)
        "Great conversation, very respectful!"
      );
      
      const flags = await datingApp.getUserFlags(user2.address);
      expect(flags.length).to.equal(1);
      expect(flags[0].from).to.equal(user1.address);
      expect(flags[0].isRedFlag).to.be.false;
      expect(flags[0].review).to.equal("Great conversation, very respectful!");
      expect(flags[0].isVisible).to.be.false; // Not approved yet
    });

    it("Should allow verified users to submit red flags", async function () {
      await datingApp.connect(user1).submitFlag(
        user2.address, 
        true, // isRedFlag = true (red flag)
        "Was rude to the waiter"
      );
      
      const flags = await datingApp.getUserFlags(user2.address);
      expect(flags.length).to.equal(1);
      expect(flags[0].from).to.equal(user1.address);
      expect(flags[0].isRedFlag).to.be.true;
      expect(flags[0].review).to.equal("Was rude to the waiter");
      expect(flags[0].isVisible).to.be.false;
    });

    it("Should prevent flagging users you haven't matched with", async function () {
      // Create a new user that hasn't matched with anyone
      const [, , , , newUser] = await ethers.getSigners();
      await datingApp.connect(newUser).registerUser("NewUser", 25, "Bio", ["interest"], 5000);
      await datingApp.connect(owner).verifyUser(newUser.address);
      
      await expect(
        datingApp.connect(user1).submitFlag(newUser.address, false, "Nice person")
      ).to.be.revertedWith("Can only flag users you have matched with");
    });

    it("Should prevent self-flagging", async function () {
      await expect(
        datingApp.connect(user1).submitFlag(user1.address, false, "I'm great!")
      ).to.be.revertedWith("Cannot flag yourself");
    });

    it("Should enforce review length limits", async function () {
      const longReview = "a".repeat(101); // 101 characters
      await expect(
        datingApp.connect(user1).submitFlag(user2.address, false, longReview)
      ).to.be.revertedWith("Review too long");
      
      await expect(
        datingApp.connect(user1).submitFlag(user2.address, false, "")
      ).to.be.revertedWith("Review cannot be empty");
    });
  });

  describe("Flag Approval", function () {
    beforeEach(async function () {
      // Submit some flags
      await datingApp.connect(user1).submitFlag(user2.address, false, "Great date!");
      await datingApp.connect(user1).submitFlag(user2.address, true, "Showed up late");
      await datingApp.connect(user3).submitFlag(user1.address, false, "Very kind");
    });

    it("Should allow users to approve flags about themselves", async function () {
      await datingApp.connect(user2).approveFlag(user1.address);
      
      const visibleFlags = await datingApp.getVisibleFlags(user2.address);
      expect(visibleFlags.length).to.equal(1);
      expect(visibleFlags[0].isVisible).to.be.true;
      expect(visibleFlags[0].review).to.equal("Great date!");
    });

    it("Should only make the first matching flag visible", async function () {
      // user1 submitted 2 flags to user2, approve should only affect the first unapproved one
      await datingApp.connect(user2).approveFlag(user1.address);
      
      const allFlags = await datingApp.getUserFlags(user2.address);
      const visibleFlags = await datingApp.getVisibleFlags(user2.address);
      
      expect(allFlags.length).to.equal(2);
      expect(visibleFlags.length).to.equal(1);
      expect(visibleFlags[0].review).to.equal("Great date!"); // First flag
    });
  });

  describe("Flag Statistics", function () {
    beforeEach(async function () {
      // Submit and approve various flags
      await datingApp.connect(user1).submitFlag(user2.address, false, "Green flag 1");
      await datingApp.connect(user3).submitFlag(user2.address, false, "Green flag 2");
      await datingApp.connect(user1).submitFlag(user2.address, true, "Red flag 1");
      
      // Approve some flags
      await datingApp.connect(user2).approveFlag(user1.address); // Approves first flag (green)
      await datingApp.connect(user2).approveFlag(user3.address); // Approves green flag from user3
    });

    it("Should return correct flag statistics", async function () {
      const stats = await datingApp.getFlagStatistics(user2.address);
      
      expect(stats.totalFlags).to.equal(3);
      expect(stats.visibleFlags).to.equal(2);
      expect(stats.greenFlags).to.equal(2);
      expect(stats.redFlags).to.equal(0); // Red flag not approved yet
    });

    it("Should return correct visible green flags", async function () {
      const greenFlags = await datingApp.getVisibleGreenFlags(user2.address);
      
      expect(greenFlags.length).to.equal(2);
      expect(greenFlags[0].isRedFlag).to.be.false;
      expect(greenFlags[1].isRedFlag).to.be.false;
    });

    it("Should return correct visible red flags", async function () {
      // First approve the red flag
      await datingApp.connect(user2).approveFlag(user1.address); // Approves second flag (red)
      
      const redFlags = await datingApp.getVisibleRedFlags(user2.address);
      
      expect(redFlags.length).to.equal(1);
      expect(redFlags[0].isRedFlag).to.be.true;
      expect(redFlags[0].review).to.equal("Red flag 1");
    });

    it("Should return empty arrays when no flags of specific type exist", async function () {
      const redFlags = await datingApp.getVisibleRedFlags(user2.address);
      expect(redFlags.length).to.equal(0);
      
      // Test user with no flags at all
      const noFlags = await datingApp.getVisibleGreenFlags(owner.address);
      expect(noFlags.length).to.equal(0);
    });
  });

  describe("Flag Events", function () {
    it("Should emit FlagSubmitted event", async function () {
      await expect(
        datingApp.connect(user1).submitFlag(user2.address, false, "Great date!")
      ).to.emit(datingApp, "FlagSubmitted")
       .withArgs(user1.address, user2.address, false, "Great date!");
    });

    it("Should emit FlagApproved event", async function () {
      await datingApp.connect(user1).submitFlag(user2.address, false, "Great date!");
      
      await expect(
        datingApp.connect(user2).approveFlag(user1.address)
      ).to.emit(datingApp, "FlagApproved")
       .withArgs(user2.address);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple flags from same user correctly", async function () {
      // Submit multiple flags
      await datingApp.connect(user1).submitFlag(user2.address, false, "First flag");
      await datingApp.connect(user1).submitFlag(user2.address, true, "Second flag");
      await datingApp.connect(user1).submitFlag(user2.address, false, "Third flag");
      
      const allFlags = await datingApp.getUserFlags(user2.address);
      expect(allFlags.length).to.equal(3);
      
      // Approve should only affect first unapproved flag
      await datingApp.connect(user2).approveFlag(user1.address);
      
      const visibleFlags = await datingApp.getVisibleFlags(user2.address);
      expect(visibleFlags.length).to.equal(1);
      expect(visibleFlags[0].review).to.equal("First flag");
    });

    it("Should handle approval when no flags exist", async function () {
      // Try to approve a flag that doesn't exist - should not revert
      await datingApp.connect(user2).approveFlag(user1.address);
      
      const visibleFlags = await datingApp.getVisibleFlags(user2.address);
      expect(visibleFlags.length).to.equal(0);
    });

    it("Should handle statistics for users with no flags", async function () {
      const stats = await datingApp.getFlagStatistics(owner.address);
      
      expect(stats.totalFlags).to.equal(0);
      expect(stats.visibleFlags).to.equal(0);
      expect(stats.greenFlags).to.equal(0);
      expect(stats.redFlags).to.equal(0);
    });
  });

  describe("Integration with User Management", function () {
    it("Should prevent unverified users from submitting flags", async function () {
      // Create unverified user (don't verify them)
      const [, , , , unverifiedUser] = await ethers.getSigners();
      await datingApp.connect(unverifiedUser).registerUser(
        "Unverified", 25, "Bio", ["interest"], 5000
      );
      
      // Can't create match with unverified user, so we'll test the verification check directly
      await expect(
        datingApp.connect(unverifiedUser).submitFlag(user1.address, false, "Nice person")
      ).to.be.revertedWith("User not verified");
    });

    it("Should prevent flagging unregistered users", async function () {
      const [, , , , , unregisteredUser] = await ethers.getSigners();
      
      await expect(
        datingApp.connect(user1).submitFlag(unregisteredUser.address, false, "Nice person")
      ).to.be.revertedWith("Target user not registered");
    });
  });
});
