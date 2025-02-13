import { ethers } from "hardhat";

async function main() {
  const [voter] = await ethers.getSigners();

  // ✅ Replace with deployed contract addresses
  const votingSystemAddress = "0x9A54a09738545bb8236D0E7C8B2993f407a2dCD5"; 
  const tokenAddress = "0xf2715Ae17CA095F7AFf148A0D88aCcE0190988a4"; 

  console.log(`🚀 Using VotingSystem at: ${votingSystemAddress}`);
  console.log(`🔹 Using ERC-20 Token at: ${tokenAddress}`);

  // ✅ Attach to VotingSystem contract
  const votingSystem = await ethers.getContractAt("VotingSystem", votingSystemAddress, voter);

  // ✅ Attach to ERC-20 Token contract
  const token = await ethers.getContractAt("IERC20", tokenAddress, voter);

  // ✅ Define ballot details
  const ballotIndex = 0; 
  const optionIndex = 1; 

  //generate a random secret salt
  const secretSalt = Math.floor(Math.random() * 1000000); 

  // ✅ Fetch ballot details before voting
  const ballot = await votingSystem.getBallot(ballotIndex);
  console.log(`📌 Ballot Details:`, ballot);
  const startTime = Number(ballot[2]);
  const duration = Number(ballot[3]);
  const currentTime = Math.floor(Date.now() / 1000);

  // ✅ Check if voting has started
  if (currentTime < startTime) {
    console.error("❌ Voting has not started yet.");
    return;
  }

  // ✅ Check if voting has ended
  if (currentTime > startTime + duration) {
    console.error("❌ Voting period has ended.");
    return;
  }

  // ✅ Check voter balance
  console.log("🔄 Checking voter token balance...");
  const tokensPerVote = await votingSystem.tokensPerVote();
  const voterBalance = await token.balanceOf(voter.address);

  if (voterBalance < tokensPerVote) {
    console.error("❌ Insufficient tokens to vote.");
    return;
  }

  // ✅ Check if voter has already voted
  const hasVoted = await votingSystem.hasVoted(ballotIndex, voter.address);
  if (hasVoted) {
    console.error("❌ You have already voted.");
    return;
  }

  // ✅ Approve token spending for voting
  console.log("🔄 Approving tokens for voting...");
  const approveTx = await token.approve(votingSystemAddress, tokensPerVote);
  await approveTx.wait();
  console.log(`✅ Approved ${tokensPerVote.toString()} tokens for voting`);

  // ✅ Cast hidden vote
  console.log(`🔄 Casting vote with secret salt: ${secretSalt}`);
  try {
    const castVoteTx = await votingSystem.castVote(ballotIndex, optionIndex, secretSalt);
    await castVoteTx.wait();
    console.log("✅ Vote successfully cast!");
  } catch (error) {
    console.error("❌ Error casting vote:", error);
  }
}

main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exitCode = 1;
});
