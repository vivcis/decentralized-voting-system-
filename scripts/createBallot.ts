import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  // ✅ Replace with your deployed VotingSystem contract address
  const votingSystemAddress = "0x9A54a09738545bb8236D0E7C8B2993f407a2dCD5";

  console.log(`🚀 Using VotingSystem at: ${votingSystemAddress}`);

  // ✅ Attach to VotingSystem contract
  const votingSystem = await ethers.getContractAt("VotingSystem", votingSystemAddress, deployer);

  console.log("🔄 Creating a new ballot...");
  const options = ["Candidate A", "Candidate B"];
  const startTime = Math.floor(Date.now() / 1000) + 300; // Starts in 5 minutes
  const duration = 600; // Voting lasts for 10 minutes
  const endTime = startTime + duration; // Calculate when voting will end

  console.log(`🕒 Ballot Start Time (Unix): ${startTime}`);
  console.log(`⏳ Voting End Time (Unix): ${endTime}`);
  console.log(`📅 Ballot Start Time (Human Readable): ${new Date(startTime * 1000).toLocaleString()}`);
  console.log(`🏁 Voting End Time (Human Readable): ${new Date(endTime * 1000).toLocaleString()}`);

  const tx = await votingSystem.createBallot("Who should lead?", options, startTime, duration);
  await tx.wait();

  console.log("✅ New ballot created successfully!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});
