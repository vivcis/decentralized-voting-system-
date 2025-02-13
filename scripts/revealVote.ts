import { ethers } from "hardhat";

async function main() {
  const [voter] = await ethers.getSigners();

  // ✅ Replace with actual deployed contract address
  const votingSystemAddress = "0x9A54a09738545bb8236D0E7C8B2993f407a2dCD5";

  console.log(`🚀 Using VotingSystem at: ${votingSystemAddress}`);

  // ✅ Attach to VotingSystem contract dynamically
  const votingSystem = await ethers.getContractAt("VotingSystem", votingSystemAddress, voter);

  // ✅ Define ballot details
  const ballotIndex = 0;
  const optionIndex = 1;
  const secretSalt = 328454;

  console.log("🔄 Checking ballot status...");

  try {
    const ballot = await votingSystem.getBallot(ballotIndex); 

    console.log("📌 Ballot Details:", ballot);

    const startTime = Number(ballot[2]);
    const duration = Number(ballot[3]);
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime < startTime + duration) {
      console.error("❌ Voting is still ongoing. Please wait.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error fetching ballot:", error);
    return;
  }

  console.log("✅ Voting has ended! Proceeding to reveal votes...");

  //reveal the Vote
  console.log("🔄 Revealing vote...");
  try {
    const revealVoteTx = await votingSystem.revealVote(ballotIndex, optionIndex, secretSalt);
    await revealVoteTx.wait();
    console.log("✅ Vote successfully revealed!");
  } catch (error) {
    console.error("⚠️ Warning: Vote may have already been revealed or other issue:", error);
  }
}

main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exitCode = 1;
});
