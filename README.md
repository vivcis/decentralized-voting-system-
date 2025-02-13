# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```


1. Setup Phase
🛠️ Deploy Contracts
Deploy VotingFactory.sol

Government deploys VotingFactory to create multiple elections.
VotingFactory.createVotingContract(tokenAddress, tokensPerVote) → Deploys VotingSystem.
Deploy VotingSystem.sol (via Factory)

VotingSystem is deployed with:
owner (admin)
votingToken (ERC-20 token for voting)
tokensPerVote (number of tokens required per vote)

2. Election Setup
Create a Ballot
✅- Admin Calls createBallot(question, options, startTime, duration)

Adds a new ballot (voting question & options).
startTime: When voting begins.
duration: Voting period in seconds.
Emits BallotCreated event.
✅ Voters Check Ballot Details (getBallot())

- Voter Calls getBallot(ballotIndex) to:
View the question and options.
Check the start time and duration.
Ensure the ballot exists before voting.

3. Voting Phase
🔑 Vote Submission (Commit)
Voter Approves Tokens for Voting

token.approve(votingSystemAddress, tokensPerVote)
Voter casts a hidden vote (commit-reveal method)

Calls castVote(ballotIndex, optionIndex, secretSalt).
Vote is hidden → Stored as a hash (keccak256(optionIndex + secretSalt)).
Tokens are transferred from voter to contract.
Emits VoteCasted event.

4. Vote Reveal Phase (After Voting Ends)
🔓 Reveal Votes
Voter reveals their vote

Calls revealVote(ballotIndex, optionIndex, secretSalt).
Contract verifies the vote using the stored hash.
Vote is decrypted and counted.
Hash is deleted after reveal.
Repeat until all votes are revealed

5. Results Announcement
📢 Fetch & Publish Results
Admin publishes results

Calls publishResults(ballotIndex).
Ensures all votes are revealed before publishing.
Stores the final results on-chain.
Emits ResultsPublished event.
Anyone can view results

Call getResults(ballotIndex) to see vote counts.

6. Election Finalization
🎯 Funds Handling
Tokens remain locked in contract (could be used for rewards, treasury, or refunds).
Optionally, implement a refund mechanism for token retrieval.