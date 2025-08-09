const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserProfile", function () {
  let userProfile;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const UserProfile = await ethers.getContractFactory("UserProfile");
    userProfile = await UserProfile.deploy();
    await userProfile.waitForDeployment();
  });

  describe("Profile Creation", function () {
    it("Should create a new profile successfully", async function () {
      const profileData = {
        name: "John Doe",
        age: 25,
        gender: "Male",
        bio: "Software developer who loves hiking and coffee",
        interests: ["Programming", "Hiking", "Coffee"],
        monthlySalary: 500000, // $5000 in cents
        profileImageHash: "QmTestImageHash123",
        payslipHash: "QmTestPayslipHash456"
      };

      await expect(
        userProfile.connect(addr1).createProfile(
          profileData.name,
          profileData.age,
          profileData.gender,
          profileData.bio,
          profileData.interests,
          profileData.monthlySalary,
          profileData.profileImageHash,
          profileData.payslipHash
        )
      ).to.emit(userProfile, "ProfileCreated")
       .withArgs(addr1.address, profileData.name, await ethers.provider.getBlockNumber() + 1);

      // Check if user is registered
      expect(await userProfile.checkRegistration(addr1.address)).to.be.true;

      // Get and verify profile data
      const profile = await userProfile.getProfile(addr1.address);
      expect(profile.name).to.equal(profileData.name);
      expect(profile.age).to.equal(profileData.age);
      expect(profile.gender).to.equal(profileData.gender);
      expect(profile.bio).to.equal(profileData.bio);
      expect(profile.interests).to.deep.equal(profileData.interests);
      expect(profile.monthlySalary).to.equal(profileData.monthlySalary);
      expect(profile.profileImageHash).to.equal(profileData.profileImageHash);
      expect(profile.payslipHash).to.equal(profileData.payslipHash);
      expect(profile.isVerified).to.be.false;
      expect(profile.isActive).to.be.true;
      expect(profile.userAddress).to.equal(addr1.address);
    });

    it("Should fail to create profile with invalid data", async function () {
      // Empty name
      await expect(
        userProfile.connect(addr1).createProfile(
          "",
          25,
          "Male",
          "Bio",
          ["Interest"],
          500000,
          "ImageHash",
          "PayslipHash"
        )
      ).to.be.revertedWith("Name cannot be empty");

      // Invalid age (too young)
      await expect(
        userProfile.connect(addr1).createProfile(
          "John",
          17,
          "Male",
          "Bio",
          ["Interest"],
          500000,
          "ImageHash",
          "PayslipHash"
        )
      ).to.be.revertedWith("Age must be between 18 and 100");

      // Invalid age (too old)
      await expect(
        userProfile.connect(addr1).createProfile(
          "John",
          101,
          "Male",
          "Bio",
          ["Interest"],
          500000,
          "ImageHash",
          "PayslipHash"
        )
      ).to.be.revertedWith("Age must be between 18 and 100");

      // Empty interests
      await expect(
        userProfile.connect(addr1).createProfile(
          "John",
          25,
          "Male",
          "Bio",
          [],
          500000,
          "ImageHash",
          "PayslipHash"
        )
      ).to.be.revertedWith("At least one interest required");

      // Zero salary
      await expect(
        userProfile.connect(addr1).createProfile(
          "John",
          25,
          "Male",
          "Bio",
          ["Interest"],
          0,
          "ImageHash",
          "PayslipHash"
        )
      ).to.be.revertedWith("Monthly salary must be greater than 0");
    });

    it("Should prevent duplicate registration", async function () {
      // Create first profile
      await userProfile.connect(addr1).createProfile(
        "John Doe",
        25,
        "Male",
        "Bio",
        ["Programming"],
        500000,
        "ImageHash",
        "PayslipHash"
      );

      // Try to create second profile with same address
      await expect(
        userProfile.connect(addr1).createProfile(
          "Jane Doe",
          30,
          "Female",
          "Different Bio",
          ["Art"],
          600000,
          "ImageHash2",
          "PayslipHash2"
        )
      ).to.be.revertedWith("User already registered");
    });
  });

  describe("Profile Management", function () {
    beforeEach(async function () {
      // Create a profile for testing
      await userProfile.connect(addr1).createProfile(
        "John Doe",
        25,
        "Male",
        "Software developer",
        ["Programming", "Hiking"],
        500000,
        "ImageHash",
        "PayslipHash"
      );
    });

    it("Should update profile successfully", async function () {
      const newBio = "Updated bio - Full stack developer";
      const newInterests = ["JavaScript", "React", "Node.js"];
      const newImageHash = "QmNewImageHash789";

      await expect(
        userProfile.connect(addr1).updateProfile(
          newBio,
          newInterests,
          newImageHash
        )
      ).to.emit(userProfile, "ProfileUpdated");

      const profile = await userProfile.getProfile(addr1.address);
      expect(profile.bio).to.equal(newBio);
      expect(profile.interests).to.deep.equal(newInterests);
      expect(profile.profileImageHash).to.equal(newImageHash);
    });

    it("Should get own profile", async function () {
      const profile = await userProfile.connect(addr1).getMyProfile();
      expect(profile.name).to.equal("John Doe");
      expect(profile.userAddress).to.equal(addr1.address);
    });

    it("Should verify profile", async function () {
      await expect(
        userProfile.verifyProfile(addr1.address)
      ).to.emit(userProfile, "ProfileVerified");

      const profile = await userProfile.getProfile(addr1.address);
      expect(profile.isVerified).to.be.true;
    });

    it("Should deactivate and reactivate profile", async function () {
      // Deactivate
      await userProfile.connect(addr1).deactivateProfile();
      let profile = await userProfile.getProfile(addr1.address);
      expect(profile.isActive).to.be.false;

      // Reactivate
      await userProfile.connect(addr1).reactivateProfile();
      profile = await userProfile.getProfile(addr1.address);
      expect(profile.isActive).to.be.true;
    });
  });

  describe("User Discovery", function () {
    beforeEach(async function () {
      // Create multiple profiles
      await userProfile.connect(addr1).createProfile(
        "John Doe",
        25,
        "Male",
        "Developer",
        ["Programming"],
        500000,
        "ImageHash1",
        "PayslipHash1"
      );

      await userProfile.connect(addr2).createProfile(
        "Jane Smith",
        28,
        "Female",
        "Designer",
        ["Design"],
        450000,
        "ImageHash2",
        "PayslipHash2"
      );
    });

    it("Should return correct total users count", async function () {
      const totalUsers = await userProfile.getTotalUsers();
      expect(totalUsers).to.equal(2);
    });

    it("Should get users with pagination", async function () {
      const users = await userProfile.getUsers(0, 10);
      expect(users.length).to.equal(2);
      expect(users[0]).to.equal(addr1.address);
      expect(users[1]).to.equal(addr2.address);
    });

    it("Should get active users only", async function () {
      // Deactivate one user
      await userProfile.connect(addr1).deactivateProfile();

      const activeUsers = await userProfile.getActiveUsers(0, 10);
      expect(activeUsers.length).to.equal(1);
      expect(activeUsers[0]).to.equal(addr2.address);
    });

    it("Should handle pagination correctly", async function () {
      // Get first user only
      const firstUser = await userProfile.getUsers(0, 1);
      expect(firstUser.length).to.equal(1);
      expect(firstUser[0]).to.equal(addr1.address);

      // Get second user only
      const secondUser = await userProfile.getUsers(1, 1);
      expect(secondUser.length).to.equal(1);
      expect(secondUser[0]).to.equal(addr2.address);
    });
  });

  describe("Access Control", function () {
    it("Should prevent non-registered users from updating profile", async function () {
      await expect(
        userProfile.connect(addr1).updateProfile(
          "New bio",
          ["New interest"],
          "NewImageHash"
        )
      ).to.be.revertedWith("User not registered");
    });

    it("Should prevent non-registered users from getting own profile", async function () {
      await expect(
        userProfile.connect(addr1).getMyProfile()
      ).to.be.revertedWith("User not registered");
    });

    it("Should prevent non-registered users from deactivating profile", async function () {
      await expect(
        userProfile.connect(addr1).deactivateProfile()
      ).to.be.revertedWith("User not registered");
    });
  });
}); 