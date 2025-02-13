import { ethers } from "hardhat";

async function main() {
  const [deployer, voter] = await ethers.getSigners();
  const votingSystemAddress = "0x9A54a09738545bb8236D0E7C8B2993f407a2dCD5"; // New Voting System
  const tokenAddress = "0xf2715Ae17CA095F7AFf148A0D88aCcE0190988a4";

  const votingSystem = await ethers.getContractAt("VotingSystem", votingSystemAddress, voter);

  const ballotIndex = 0;
  const optionIndex = 1;
  const secretSalt = 328454; 

  console.log("🔄 Checking ballot status...");
  const ballot = await votingSystem.getBallot(ballotIndex);
  const votingEndTime = Number(ballot[2]) + Number(ballot[3]);
  const currentTime = Math.floor(Date.now() / 1000);

  if (currentTime < votingEndTime) {
    console.log(`⏳ Voting is still ongoing. It will end at ${new Date(votingEndTime * 1000).toLocaleString()}`);
    console.log("🔄 Waiting for voting to end...");

    // Wait until the voting period is over
    while (Math.floor(Date.now() / 1000) < votingEndTime) {
      console.log("⏳ Still waiting...");
      await new Promise(resolve => setTimeout(resolve, 60000)); // Check every 60 seconds
    }
  }

  console.log("✅ Voting has ended! Proceeding to reveal votes...");

  // ✅ Step 1: Reveal the Vote
  console.log("🔄 Revealing vote...");
  try {
    const revealVoteTx = await votingSystem.revealVote(ballotIndex, optionIndex, secretSalt);
    await revealVoteTx.wait();
    console.log("✅ Vote Revealed");
  } catch (error) {
    console.error("⚠️ Warning: Vote may have already been revealed or other issue.");
  }

  // ✅ Step 2: Admin Publishes Results
  console.log("🔄 Publishing results (Admin Only)...");
  try {
    const publishTx = await votingSystem.connect(deployer).publishResults(ballotIndex);
    await publishTx.wait();
    console.log("✅ Results Published");
  } catch (error) {
    console.log("⚠️ Error Publishing Results (Only Admin Can Do This).");
  }

  // ✅ Step 3: Fetch & Display Results
  console.log("🔄 Fetching results...");
  try {
    const results = await votingSystem.getResults(ballotIndex);
    console.log("🏆 Election Results:", results);
  } catch (error) {
    console.error("❌ Error: Results not available. Ensure the admin has published them.");
  }

  console.log("✅ Automation script completed.");
}

main().catch((error) => {
  console.error("❌ Error in automation script:", error);
  process.exitCode = 1;
});
