import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`🚀 Deploying contracts with the account: ${deployer.address}`);

  // Deploy VotingFactory contract
  const VotingFactory = await ethers.getContractFactory("VotingFactory");
  const votingFactory = await VotingFactory.deploy();
  await votingFactory.waitForDeployment();

  console.log(`✅ VotingFactory deployed at: ${await votingFactory.getAddress()}`);

  // Define ERC-20 token details (Replace with actual token address)
  const tokenAddress = "0xf2715Ae17CA095F7AFf148A0D88aCcE0190988a4";  
  const tokensPerVote = ethers.parseUnits("10", 18); // 10 tokens per vote

  // Create a VotingSystem contract via factory
  const tx = await votingFactory.createVotingContract(tokenAddress, tokensPerVote);
  await tx.wait();

  // Get deployed voting contracts
  const deployedContracts = await votingFactory.getVotingContracts();
  console.log(`✅ VotingSystem deployed at: ${deployedContracts[0]}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
