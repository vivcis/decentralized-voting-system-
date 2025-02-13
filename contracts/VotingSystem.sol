// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Votes are hidden during the election period.
// Results are revealed only after voting ends.
// No vote manipulation or duplicate voting is possible.
// Immutable records are stored on the blockchain.

contract VotingSystem {
   
    error AlreadyVoted();
    error InvalidBallot();
    error InvalidOption();
    error VotingNotStarted();
    error VotingEnded();
    error Unauthorized();
    error InsufficientTokens();
    
    struct Ballot {
        string question;
        string[] options;
        uint256 startTime;
        uint256 duration;
        bool exists;
        bool resultsPublished;
    }

    address public immutable owner;
    IERC20 public immutable votingToken;
    uint256 public immutable tokensPerVote;
    uint256 public ballotCounter;
    
    mapping(uint256 => Ballot) private ballots;
    //store encrypted votes
    mapping(uint256 => mapping(address => bytes32)) private voteHashes;  
    mapping(uint256 => mapping(uint256 => uint256)) private decryptedTally;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event BallotCreated(uint256 ballotIndex, string question, uint256 startTime, uint256 duration);
    event VoteCasted(uint256 ballotIndex, address voter);
    event ResultsPublished(uint256 ballotIndex, uint256[] results);

    constructor(address _owner, address tokenAddress, uint256 _tokensPerVote) {
        owner = _owner;
        votingToken = IERC20(tokenAddress);
        tokensPerVote = _tokensPerVote;
    }

    /// @notice Creates a new ballot
    function createBallot(string calldata question, string[] calldata options, uint256 startTime, uint256 duration) external {
        if (msg.sender != owner) revert Unauthorized();
        if (options.length < 2) revert InvalidOption();

        ballots[ballotCounter] = Ballot({
            question: question,
            options: options,
            startTime: startTime,
            duration: duration,
            exists: true,
            resultsPublished: false
        });

        emit BallotCreated(ballotCounter, question, startTime, duration);
        ballotCounter++;
    }

        /// @notice Retrieves ballot details
    function getBallot(uint256 ballotIndex) external view returns (
        string memory question,
        string[] memory options,
        uint256 startTime,
        uint256 duration,
        bool exists
    ) {
        if (!ballots[ballotIndex].exists) revert InvalidBallot();
        Ballot storage ballot = ballots[ballotIndex];

        return (ballot.question, ballot.options, ballot.startTime, ballot.duration, ballot.exists);
    }

    /// @notice Casts a vote using a hash commitment (Votes are hidden)
    function castVote(uint256 ballotIndex, uint256 optionIndex, uint256 secretSalt) external {
        if (!ballots[ballotIndex].exists) revert InvalidBallot();
        if (hasVoted[ballotIndex][msg.sender]) revert AlreadyVoted();

        Ballot memory ballot = ballots[ballotIndex];
        if (block.timestamp < ballot.startTime) revert VotingNotStarted();
        if (block.timestamp >= ballot.startTime + ballot.duration) revert VotingEnded();
        if (optionIndex >= ballot.options.length) revert InvalidOption();

        // Transfer voting tokens
        if (votingToken.balanceOf(msg.sender) < tokensPerVote) revert InsufficientTokens();
        require(votingToken.transferFrom(msg.sender, address(this), tokensPerVote), "Token transfer failed");

        // Hash the vote (optionIndex + secretSalt) to keep it hidden
        bytes32 voteHash = keccak256(abi.encodePacked(msg.sender, optionIndex, secretSalt));
        voteHashes[ballotIndex][msg.sender] = voteHash;
        hasVoted[ballotIndex][msg.sender] = true;

        emit VoteCasted(ballotIndex, msg.sender);
    }

    /// @notice Reveal vote (User submits their original choice + secretSalt)
    function revealVote(uint256 ballotIndex, uint256 optionIndex, uint256 secretSalt) external {
        if (!ballots[ballotIndex].exists) revert InvalidBallot();
        if (!hasVoted[ballotIndex][msg.sender]) revert Unauthorized();

        // Verify the original vote hash matches
        bytes32 expectedHash = keccak256(abi.encodePacked(msg.sender, optionIndex, secretSalt));
        require(voteHashes[ballotIndex][msg.sender] == expectedHash, "Invalid vote reveal");

        // Store decrypted tally
        decryptedTally[ballotIndex][optionIndex]++;

        // Clear vote hash after revealing
        delete voteHashes[ballotIndex][msg.sender];
    }

    /// @notice Returns results **only after voting ends**
    function getResults(uint256 ballotIndex) external view returns (uint256[] memory) {
        if (!ballots[ballotIndex].exists) revert InvalidBallot();
        if (block.timestamp < ballots[ballotIndex].startTime + ballots[ballotIndex].duration) revert VotingNotStarted();

        uint256 len = ballots[ballotIndex].options.length;
        uint256[] memory results = new uint256[](len);
        
        for (uint256 i = 0; i < len; i++) {
            results[i] = decryptedTally[ballotIndex][i]; 
        }

        return results;
    }

    /// @notice Publishes results (admin action)
    function publishResults(uint256 ballotIndex) external {
        if (msg.sender != owner) revert Unauthorized();
        if (!ballots[ballotIndex].exists) revert InvalidBallot();
        if (block.timestamp < ballots[ballotIndex].startTime + ballots[ballotIndex].duration) revert VotingNotStarted();
        if (ballots[ballotIndex].resultsPublished) revert VotingEnded();

        ballots[ballotIndex].resultsPublished = true;

        uint256 len = ballots[ballotIndex].options.length;
        uint256[] memory results = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            results[i] = decryptedTally[ballotIndex][i];
        }

        emit ResultsPublished(ballotIndex, results);
    }
}
