const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DatingApp", function () {
  let datingApp;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    const DatingApp = await ethers.getContractFactory("DatingApp");
    datingApp = await DatingApp.deploy();
  });

  it("Should deploy successfully", async function () {
    expect(await datingApp.getAddress()).to.not.equal(ethers.ZeroAddress);
  });

  it("Should register user with monthly salary", async function () {
    const name = "John Doe";
    const age = 25;
    const bio = "I love coding";
    const interests = ["coding", "gaming"];
    const monthlySalary = 500000; // $5000 in cents

    await datingApp.connect(user1).registerUser(name, age, bio, interests, monthlySalary);

    // Check if user is registered
    expect(await datingApp.isRegistered(user1.address)).to.be.true;

    // Get user profile
    const profile = await datingApp.getUserProfile(user1.address);
    
    expect(profile[0]).to.equal(name); // name
    expect(profile[1]).to.equal(age); // age
    expect(profile[2]).to.equal(bio); // bio
    expect(profile[3]).to.deep.equal(interests); // interests
    expect(profile[4]).to.equal(monthlySalary); // monthlySalary
    expect(profile[5]).to.be.false; // isVerified
    expect(profile[6]).to.be.true; // isActive
  });

  it("Should reject registration with zero salary", async function () {
    const name = "John Doe";
    const age = 25;
    const bio = "I love coding";
    const interests = ["coding", "gaming"];
    const monthlySalary = 0; // Zero salary

    await expect(
      datingApp.connect(user1).registerUser(name, age, bio, interests, monthlySalary)
    ).to.be.revertedWith("Monthly salary must be greater than 0");
  });
}); 