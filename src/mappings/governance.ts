import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  GovernanceFramework,
  Proposal,
  RTokenContract,
} from "../../generated/schema";
import { BIGINT_ONE, ProposalState } from "../common/constants";
import {
  getGovernance,
  getProposal,
  _handleProposalCanceled,
  _handleProposalCreated,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteCast,
} from "../governance/handlers";
import {
  Governor,
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  ProposalThresholdSet,
  QuorumNumeratorUpdated,
  TimelockChange,
  VoteCast,
  VotingDelaySet,
  VotingPeriodSet,
} from "./../../generated/templates/Governance/Governor";

// ProposalCanceled(proposalId)
export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.proposalId.toString(), event);
}

// ProposalCreated(proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description)
export function handleProposalCreated(event: ProposalCreated): void {
  const quorumVotes = getQuorumFromContract(
    event.address,
    event.block.number.minus(BIGINT_ONE)
  );

  // FIXME: Prefer to use a single object arg for params
  // e.g.  { proposalId: event.params.proposalId, proposer: event.params.proposer, ...}
  // but graph wasm compilation breaks for unknown reasons
  _handleProposalCreated(
    event.params.proposalId.toString(),
    event.params.proposer.toHexString(),
    event.params.targets,
    event.params.values,
    event.params.signatures,
    event.params.calldatas,
    event.params.startBlock,
    event.params.endBlock,
    event.params.description,
    quorumVotes,
    event
  );
}

// ProposalExecuted(proposalId)
export function handleProposalExecuted(event: ProposalExecuted): void {
  _handleProposalExecuted(event.params.proposalId.toString(), event);
}

// ProposalQueued(proposalId, eta)
export function handleProposalQueued(event: ProposalQueued): void {
  _handleProposalQueued(event.params.proposalId, event.params.eta, event);
}

export function handleProposalThresholdSet(event: ProposalThresholdSet): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString(),
    event.block.number
  );
  governanceFramework.proposalThreshold = event.params.newProposalThreshold;
  governanceFramework.save();
}

// QuorumNumeratorUpdated(oldQuorumNumerator, newQuorumNumerator)
export function handleQuorumNumeratorUpdated(
  event: QuorumNumeratorUpdated
): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString(),
    event.block.number
  );
  governanceFramework.quorumNumerator = event.params.newQuorumNumerator;
  governanceFramework.save();
}

// TimelockChange (address oldTimelock, address newTimelock)
export function handleTimelockChange(event: TimelockChange): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString(),
    event.block.number
  );
  governanceFramework.timelockAddress = event.params.newTimelock.toHexString();
  governanceFramework.save();
}

function getLatestProposalValues(
  proposalId: string,
  governorId: string,
  contractAddress: Address
): Proposal {
  const proposal = getProposal(proposalId, contractAddress.toHexString());

  // On first vote, set state and quorum values
  if (proposal.state == ProposalState.PENDING) {
    proposal.state = ProposalState.ACTIVE;
    proposal.quorumVotes = getQuorumFromContract(
      contractAddress,
      proposal.startBlock
    );

    const governance = getGovernance(governorId);
    proposal.tokenHoldersAtStart = governance.currentTokenHolders;
    proposal.delegatesAtStart = governance.currentDelegates;
  }
  return proposal;
}

// VoteCast(account, proposalId, support, weight, reason);
export function handleVoteCast(event: VoteCast): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  const proposal = getLatestProposalValues(
    event.params.proposalId.toString(),
    rTokenContract.rToken,
    event.address
  );

  _handleVoteCast(
    proposal,
    event.params.voter.toHexString(),
    event.params.weight,
    event.params.reason,
    event.params.support,
    event
  );
}

export function handleVotingDelaySet(event: VotingDelaySet): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString(),
    event.block.number
  );
  governanceFramework.votingDelay = event.params.newVotingDelay;
  governanceFramework.save();
}

export function handleVotingPeriodSet(event: VotingPeriodSet): void {
  const governanceFramework = getGovernanceFramework(
    event.address.toHexString(),
    event.block.number
  );
  governanceFramework.votingPeriod = event.params.newVotingPeriod;
  governanceFramework.save();
}

// Helper function that imports and binds the contract
export function getGovernanceFramework(
  contractAddress: string,
  blockNumber: BigInt
): GovernanceFramework {
  let governanceFramework = GovernanceFramework.load(contractAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(contractAddress);
    let rTokenContract = RTokenContract.load(contractAddress)!;
    const contract = Governor.bind(Address.fromString(contractAddress));

    governanceFramework.name = contract.name();

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.timelockAddress = contract.timelock().toHexString();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();
    governanceFramework.proposalThreshold = contract.proposalThreshold();
    governanceFramework.quorumNumerator = contract.quorumNumerator(blockNumber);
    governanceFramework.quorumDenominator = contract.quorumDenominator();
    governanceFramework.governance = rTokenContract.rToken;
  }

  return governanceFramework;
}

function getQuorumFromContract(
  contractAddress: Address,
  blockNumber: BigInt
): BigInt {
  const contract = Governor.bind(contractAddress);
  const quorumVotes = contract.quorum(blockNumber);

  const governanceFramework = getGovernanceFramework(
    contractAddress.toHexString(),
    blockNumber
  );
  governanceFramework.quorumVotes = quorumVotes;
  governanceFramework.save();

  return quorumVotes;
}
