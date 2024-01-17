import { Address, BigInt, Bytes, crypto, ethereum, log } from "@graphprotocol/graph-ts";
import {
  GovernanceFramework,
  Proposal,
  RToken,
  RTokenContract,
  TimelockProposal,
} from "../../generated/schema";
import { Governance as GovernanceTemplate } from "../../generated/templates";
import {
  Cancelled,
  RoleGranted,
  RoleRevoked,
  Timelock,
} from "../../generated/templates/Main/Timelock";
import { BIGINT_ONE, ContractName, ProposalState } from "../common/constants";
import { removeFromArrayAtIndex } from "../common/utils/arrays";
import {
  _handleProposalCanceled,
  _handleProposalCreated,
  _handleProposalExecuted,
  _handleProposalQueued,
  _handleVoteCast,
  getGovernance,
  getProposal,
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
import { encodeAndHash } from "../common/utils/encoding";

// ProposalCanceled(proposalId)
export function handleProposalCanceled(event: ProposalCanceled): void {
  _handleProposalCanceled(event.params.proposalId.toString(), event);
}

export function _createTimelockProposal(event: ProposalCreated): string {
  const params = [
    ethereum.Value.fromAddressArray(event.params.targets),
    ethereum.Value.fromUnsignedBigIntArray([BigInt.fromU64(0)]),
    ethereum.Value.fromBytesArray(event.params.calldatas),
    ethereum.Value.fromUnsignedBigInt(BigInt.fromU64(0)),
    ethereum.Value.fromFixedBytes(Bytes.fromByteArray(crypto.keccak256(Bytes.fromUTF8(event.params.description))))
  ]

  let timelockId = encodeAndHash(params).toHexString();

  let timelockProposal = new TimelockProposal(timelockId);
  timelockProposal.proposalId = event.params.proposalId.toString();
  timelockProposal.save();

  return timelockId;
}

// ProposalCreated(proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description)
export function handleProposalCreated(event: ProposalCreated): void {
  const quorumVotes = getQuorumFromContract(
    event.address,
    event.block.number.minus(BIGINT_ONE)
  );

  _createTimelockProposal(event);

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

export function handleTimelockRoleGranted(event: RoleGranted): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;
  let gov = getGovernance(rToken.id);

  let timelockContract = Timelock.bind(event.address);
  let proposalRole = timelockContract.PROPOSER_ROLE();
  let guardianRole = timelockContract.CANCELLER_ROLE();

  if (event.params.role.equals(proposalRole)) {
    // Init governance
    // TODO: Multiple governance are supported but not really the case
    let governorContract = new RTokenContract(
      event.params.account.toHexString()
    );
    governorContract.rToken = rToken.id;
    governorContract.name = ContractName.GOVERNOR;
    governorContract.save();
    GovernanceTemplate.create(event.params.account);
  } else if (event.params.role.equals(guardianRole)) {
    // TODO: guardians should be related to the governanceFramework and not the Governance entity
    // TODO: Leave it on the governance entity in the meantime, the issue is getting the proposal role from timelock and figure out the proposal address
    let current = gov.get("guardians")!.toStringArray();
    current.push(event.params.account.toHexString());
    gov.guardians = current;
    gov.save();
  }
}

export function handleTimelockRoleRevoked(event: RoleRevoked): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;

  let timelockContract = Timelock.bind(event.address);
  let guardianRole = timelockContract.CANCELLER_ROLE();

  if (event.params.role.equals(guardianRole)) {
    let gov = getGovernance(rToken.id);
    let current = gov.guardians;
    let index = current.indexOf(event.params.account.toHexString());

    if (index != -1) {
      gov.guardians = removeFromArrayAtIndex(current, index);
      gov.save();
    }
  }
}

export function handleTimelockProposalCanceled(event: Cancelled): void {
  const timelockId = event.params.id.toHexString();
  const timelockProposal = TimelockProposal.load(timelockId);

  if (!timelockProposal) {
    log.error("Timelock id {} not found", [timelockId]);
    return;
  }

  const proposalId = timelockProposal.proposalId;

  _handleProposalCanceled(
    proposalId,
    event
  );
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
    const timelockAddress = contract.timelock();
    const timelockContract = Timelock.bind(timelockAddress);

    governanceFramework.name = contract.name();

    governanceFramework.contractAddress = contractAddress;
    governanceFramework.timelockAddress = timelockAddress.toHexString();
    governanceFramework.executionDelay = timelockContract.getMinDelay();

    governanceFramework.votingDelay = contract.votingDelay();
    governanceFramework.votingPeriod = contract.votingPeriod();
    governanceFramework.proposalThreshold = contract.proposalThreshold();
    governanceFramework.quorumNumerator = contract.quorumNumerator(blockNumber);
    governanceFramework.quorumDenominator = contract.quorumDenominator();
    governanceFramework.governance = rTokenContract.rToken;
    governanceFramework.save();
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
