const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DatingApp", function () {
  let datingApp;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const DatingApp = await ethers.getContractFactory("DatingApp");
    datingApp = await DatingApp.deploy();
    await datingApp.waitForDeployment();
  });

  describe("User Registration", function () {
    it("Should allow users to register", async function () {
      await datingApp.connect(user1).registerUser(
        "Alice",
        25,
        "I love hiking and coffee",
        ["hiking", "coffee", "reading"]
      );

      const profile = await datingApp.getUserProfile(user1.address);
      expect(profile.name).to.equal("Alice");
      expect(profile.age).to.equal(25);
      expect(profile.bio).to.equal("I love hiking and coffee");
      expect(profile.interests).to.deep.equal(["hiking", "coffee", "reading"]);
      expect(profile.isVerified).to.be.false;
      expect(profile.isActive).to.be.true;
    });

    it("Should prevent duplicate registration", async function () {
      await datingApp.connect(user1).registerUser(
        "Alice",
        25,
        "Bio",
        ["interest"]
      );

      await expect(
        datingApp.connect(user1).registerUser(
          "Alice2",
          26,
          "Bio2",
          ["interest2"]
        )
      ).to.be.revertedWith("User already registered");
    });

    it("Should enforce minimum age requirement", async function () {
      await expect(
        datingApp.connect(user1).registerUser(
          "Alice",
          17,
          "Bio",
          ["interest"]
        )
      ).to.be.revertedWith("Must be 18 or older");
    });
  });

  describe("User Verification", function () {
    beforeEach(async function () {
      await datingApp.connect(user1).registerUser(
        "Alice",
        25,
        "Bio",
        ["interest"]
      );
    });

    it("Should allow owner to verify users", async function () {
      await datingApp.connect(owner).verifyUser(user1.address);
      
      const profile = await datingApp.getUserProfile(user1.address);
      expect(profile.isVerified).to.be.true;
    });

    it("Should prevent non-owner from verifying users", async function () {
      await expect(
        datingApp.connect(user2).verifyUser(user1.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Matching", function () {
    beforeEach(async function () {
      await datingApp.connect(user1).registerUser(
        "Alice",
        25,
        "Bio",
        ["interest"]
      );
      await datingApp.connect(user2).registerUser(
        "Bob",
        28,
        "Bio",
        ["interest"]
      );
      await datingApp.connect(owner).verifyUser(user1.address);
      await datingApp.connect(owner).verifyUser(user2.address);
    });

    it("Should allow owner to create matches", async function () {
      await datingApp.connect(owner).createMatch(user1.address, user2.address);
      
      const matches1 = await datingApp.getUserMatches(user1.address);
      const matches2 = await datingApp.getUserMatches(user2.address);
      
      expect(matches1).to.include(user2.address);
      expect(matches2).to.include(user1.address);
    });

    it("Should prevent matching with yourself", async function () {
      await expect(
        datingApp.connect(owner).createMatch(user1.address, user1.address)
      ).to.be.revertedWith("Cannot match with yourself");
    });
  });

  describe("Flagging", function () {
    beforeEach(async function () {
      await datingApp.connect(user1).registerUser(
        "Alice",
        25,
        "Bio",
        ["interest"]
      );
      await datingApp.connect(user2).registerUser(
        "Bob",
        28,
        "Bio",
        ["interest"]
      );
      await datingApp.connect(owner).verifyUser(user1.address);
      await datingApp.connect(owner).verifyUser(user2.address);
      await datingApp.connect(owner).createMatch(user1.address, user2.address);
    });

    it("Should allow verified users to submit flags", async function () {
      await datingApp.connect(user1).submitFlag(
        user2.address,
        false, // green flag
        "Great conversation and chemistry!"
      );

      const flags = await datingApp.getUserFlags(user2.address);
      expect(flags.length).to.equal(1);
      expect(flags[0].from).to.equal(user1.address);
      expect(flags[0].isRedFlag).to.be.false;
      expect(flags[0].review).to.equal("Great conversation and chemistry!");
    });

    it("Should prevent flagging yourself", async function () {
      await expect(
        datingApp.connect(user1).submitFlag(
          user1.address,
          false,
          "Review"
        )
      ).to.be.revertedWith("Cannot flag yourself");
    });

    it("Should only allow flagging matched users", async function () {
      await datingApp.connect(user3).registerUser(
        "Charlie",
        30,
        "Bio",
        ["interest"]
      );
      await datingApp.connect(owner).verifyUser(user3.address);

      await expect(
        datingApp.connect(user3).submitFlag(
          user1.address,
          false,
          "Review"
        )
      ).to.be.revertedWith("Can only flag users you have matched with");
    });
  });

  describe("Flag Approval", function () {
    beforeEach(async function () {
      await datingApp.connect(user1).registerUser(
        "Alice",
        25,
        "Bio",
        ["interest"]
      );
      await datingApp.connect(user2).registerUser(
        "Bob",
        28,
        "Bio",
        ["interest"]
      );
      await datingApp.connect(owner).verifyUser(user1.address);
      await datingApp.connect(owner).verifyUser(user2.address);
      await datingApp.connect(owner).createMatch(user1.address, user2.address);
      await datingApp.connect(user1).submitFlag(
        user2.address,
        false,
        "Great date!"
      );
    });

    it("Should allow users to approve flags", async function () {
      await datingApp.connect(user2).approveFlag(user1.address);
      
      const visibleFlags = await datingApp.getVisibleFlags(user2.address);
      expect(visibleFlags.length).to.equal(1);
      expect(visibleFlags[0].isVisible).to.be.true;
    });
  });
}); 