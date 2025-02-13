// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./VotingSystem.sol";

// Votes are hidden during the election period.
// Results are revealed only after voting ends.
// No vote manipulation or duplicate voting is possible.
// Immutable records are stored on the blockchain.

contract VotingFactory {
    event VotingContractCreated(address indexed votingContract, address creator);

    /// @notice Stores addresses of deployed voting contracts
    address[] public votingContracts;

    /// @dev Creates a new VotingSystem contract and stores its address
    function createVotingContract(address tokenAddress, uint256 tokensPerVote) external {

        // Deploy the new VotingSystem contract
        VotingSystem newVotingContract = new VotingSystem(msg.sender, tokenAddress, tokensPerVote);

        // Store the contract address instead of the instance
        votingContracts.push(address(newVotingContract));

        // Emit event with the deployed contract address
        emit VotingContractCreated(address(newVotingContract), msg.sender);
    }

    /// @notice Returns all deployed voting contract addresses
    function getVotingContracts() external view returns (address[] memory) {
        return votingContracts;
    }
}
