import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  // ✅ Replace with your existing VotingFactory contract address
  const votingFactoryAddress = "0xE43e91a183D1BC38B6Ad792e98C473626996186c";
  const tokenAddress = "0xf2715Ae17CA095F7AFf148A0D88aCcE0190988a4"; // ERC-20 Token Address
  const tokensPerVote = ethers.parseUnits("10", 18); // 10 tokens per vote

  console.log(`🚀 Using VotingFactory at: ${votingFactoryAddress}`);

  // ✅ Attach to the VotingFactory contract
  const votingFactory = await ethers.getContractAt("VotingFactory", votingFactoryAddress, deployer);

  console.log("🔄 Creating a new VotingSystem...");
  const tx = await votingFactory.createVotingContract(tokenAddress, tokensPerVote);
  await tx.wait();

  // ✅ Fetch newly deployed VotingSystem contracts
  const deployedContracts = await votingFactory.getVotingContracts();
  const newVotingSystemAddress = deployedContracts[deployedContracts.length - 1];

  console.log(`✅ New VotingSystem deployed at: ${newVotingSystemAddress}`);
}

main().catch((error) => {
  console.error("❌ Error in deployment:", error);
  process.exitCode = 1;
});
