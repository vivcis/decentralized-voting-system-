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
  const ballotIndex = 0; // Change based on the ballot
  const optionIndex = 1; // Index of the option being voted for
  const tokensPerVote = await votingSystem.tokensPerVote();

   // Generate random salt
  const secretSalt = Math.floor(Math.random() * 1000000);

  console.log("🔄 Checking voter token balance...");
  const voterBalance = await token.balanceOf(voter.address);

  if (voterBalance < tokensPerVote) {
    console.error("❌ Insufficient tokens to vote.");
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

