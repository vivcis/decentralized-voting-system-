import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("VotingSystem", function () {
  async function deployVotingSystemFixture() {
    const [deployer, voter1, voter2, nonVoter] = await ethers.getSigners();

    // ✅ Deploy ERC-20 token for voting
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("VoteToken", "APC");
    await token.waitForDeployment();

    // ✅ Mint tokens for voters
    const tokensPerVote = ethers.parseUnits("10", 18);
    await token.mint(voter1.address, tokensPerVote * 2n);
    await token.mint(voter2.address, tokensPerVote * 2n);

    // ✅ Deploy VotingSystem contract
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    const votingSystem = await VotingSystem.deploy(deployer.address, token.target, tokensPerVote);
    await votingSystem.waitForDeployment();

    // ✅ Approve tokens for voting
    await token.connect(voter1).approve(votingSystem.target, tokensPerVote);
    await token.connect(voter2).approve(votingSystem.target, tokensPerVote);

    return { votingSystem, token, deployer, voter1, voter2, nonVoter, tokensPerVote };
  }

  describe("castVote()", function () {
    it("✅ Votes should be hidden during the election period", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);

      const options = ["Alice", "Bob"];
      const startTime = await time.latest() + 60; // Starts in 1 min
      const duration = 300; // Voting lasts 5 minutes

      // Admin creates a ballot
      await votingSystem.createBallot("Who should be president?", options, startTime, duration);

      // Wait until voting starts
      await time.increaseTo(startTime + 1);

      // Voter casts a hidden vote
      const secretSalt = 123456;
      await expect(votingSystem.connect(voter1).castVote(0, 1, secretSalt))
        .to.emit(votingSystem, "VoteCasted")
        .withArgs(0, voter1.address);

      // Ensure votes are hidden before revealing
      await expect(votingSystem.getResults(0)).to.be.revertedWithCustomError(votingSystem, "VotingNotStarted");
    });
  });

  // ✅ Test for getBallot()
  describe("getBallot()", function () {
    it("✅ Should return ballot details", async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);

      const options = ["Alice", "Bob"];
      const startTime = await time.latest() + 60;
      const duration = 300;

      await votingSystem.createBallot("Who should be president?", options, startTime, duration);

      const ballot = await votingSystem.getBallot(0);

      expect(ballot[0]).to.equal("Who should be president?");
      expect(ballot[1]).to.deep.equal(options);
      expect(ballot[2]).to.equal(startTime);
      expect(ballot[3]).to.equal(duration);
      expect(ballot[4]).to.be.true;
    });

    it("❌ Should revert when querying a non-existent ballot", async function () {
      const { votingSystem } = await loadFixture(deployVotingSystemFixture);
      await expect(votingSystem.getBallot(999)).to.be.revertedWithCustomError(votingSystem, "InvalidBallot");
    });
  });

  // ✅ Test for castVote()
  describe("castVote()", function () {
    it("✅ Should allow a voter to cast a vote", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);

      const options = ["Alice", "Bob"];
      const startTime = await time.latest() + 60;
      const duration = 300;

      await votingSystem.createBallot("Who should be president?", options, startTime, duration);
      await time.increaseTo(startTime + 1);

      const secretSalt = 123456;
      await expect(votingSystem.connect(voter1).castVote(0, 1, secretSalt))
        .to.emit(votingSystem, "VoteCasted")
        .withArgs(0, voter1.address);
    });

    it("❌ Should prevent double voting", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);

      const options = ["Alice", "Bob"];
      const startTime = await time.latest() + 60;
      const duration = 300;

      await votingSystem.createBallot("Who should be president?", options, startTime, duration);
      await time.increaseTo(startTime + 1);

      const secretSalt = 123456;
      await votingSystem.connect(voter1).castVote(0, 1, secretSalt);

      await expect(votingSystem.connect(voter1).castVote(0, 1, secretSalt))
        .to.be.revertedWithCustomError(votingSystem, "AlreadyVoted");
    });

    it("❌ Should revert if voting period hasn't started", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);

      const options = ["Alice", "Bob"];
      const startTime = await time.latest() + 60;
      const duration = 300;

      await votingSystem.createBallot("Who should be president?", options, startTime, duration);

      const secretSalt = 123456;
      await expect(votingSystem.connect(voter1).castVote(0, 1, secretSalt))
        .to.be.revertedWithCustomError(votingSystem, "VotingNotStarted");
    });

    it("❌ Should revert if voting period has ended", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);

      const options = ["Alice", "Bob"];
      const startTime = await time.latest() + 60;
      const duration = 300;

      await votingSystem.createBallot("Who should be president?", options, startTime, duration);
      await time.increaseTo(startTime + duration + 1);

      const secretSalt = 123456;
      await expect(votingSystem.connect(voter1).castVote(0, 1, secretSalt))
        .to.be.revertedWithCustomError(votingSystem, "VotingEnded");
    });

    it("❌ Should prevent voting for an invalid option", async function () {
      const { votingSystem, voter1 } = await loadFixture(deployVotingSystemFixture);

      const options = ["Alice", "Bob"];
      const startTime = await time.latest() + 60;
      const duration = 300;

      await votingSystem.createBallot("Who should be president?", options, startTime, duration);
      await time.increaseTo(startTime + 1);

      const secretSalt = 123456;
      await expect(votingSystem.connect(voter1).castVote(0, 99, secretSalt))
        .to.be.revertedWithCustomError(votingSystem, "InvalidOption");
    });

    it("❌ Should prevent non-token holders from voting", async function () {
      const { votingSystem, nonVoter } = await loadFixture(deployVotingSystemFixture);

      const options = ["Alice", "Bob"];
      const startTime = await time.latest() + 60;
      const duration = 300;

      await votingSystem.createBallot("Who should be president?", options, startTime, duration);
      await time.increaseTo(startTime + 1);

      const secretSalt = 123456;
      await expect(votingSystem.connect(nonVoter).castVote(0, 1, secretSalt))
        .to.be.revertedWithCustomError(votingSystem, "InsufficientTokens");
    });
  });
});
