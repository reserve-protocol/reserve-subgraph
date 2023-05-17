import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Delegate,
  DelegateChange,
  DelegateVotingPowerChange,
  Governance,
  Proposal,
  RToken,
  RTokenContract,
  stTokenDailySnapshot,
  TokenHolder,
  Vote,
  VoteDailySnapshot,
} from "../../generated/schema";
import { Timelock } from "./../../generated/templates/Main/Timelock";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  ProposalState,
  VoteChoice,
  ZERO_ADDRESS,
} from "../common/constants";
import { getGovernanceFramework } from "../mappings/governance";

export const SECONDS_PER_DAY = 60 * 60 * 24;

export function toDecimal(value: BigInt, decimals: number = 18): BigDecimal {
  return value.divDecimal(
    BigInt.fromI32(10)
      .pow(<u8>decimals)
      .toBigDecimal()
  );
}
export function addressesToStrings(addresses: Address[]): Array<string> {
  const byteAddresses = new Array<string>();
  for (let i = 0; i < addresses.length; i++) {
    byteAddresses.push(addresses[i].toHexString());
  }
  return byteAddresses;
}

export function getVoteChoiceByValue(choiceValue: number): string {
  if (choiceValue === VoteChoice.AGAINST_VALUE) {
    return VoteChoice.AGAINST;
  } else if (choiceValue === VoteChoice.FOR_VALUE) {
    return VoteChoice.FOR;
  } else if (choiceValue === VoteChoice.ABSTAIN_VALUE) {
    return VoteChoice.ABSTAIN;
  } else {
    // Case that shouldn't happen
    log.error("Voting choice of {} does not exist", [choiceValue.toString()]);
    return VoteChoice.ABSTAIN;
  }
}

export function getGovernance(id: string): Governance {
  let governance = Governance.load(id);
  if (!governance) {
    governance = new Governance(id);
    governance.totalTokenSupply = BIGINT_ZERO;
    governance.proposals = BIGINT_ZERO;
    governance.currentTokenHolders = BIGINT_ZERO;
    governance.totalTokenHolders = BIGINT_ZERO;
    governance.currentDelegates = BIGINT_ZERO;
    governance.totalDelegates = BIGINT_ZERO;
    governance.delegatedVotesRaw = BIGINT_ZERO;
    governance.delegatedVotes = BIGDECIMAL_ZERO;
    governance.proposalsQueued = BIGINT_ZERO;
    governance.proposalsExecuted = BIGINT_ZERO;
    governance.proposalsCanceled = BIGINT_ZERO;
    governance.rToken = id;
  }

  return governance;
}

export function createDelegateChange(
  event: ethereum.Event,
  toDelegate: string,
  fromDelegate: string,
  delegator: string
): DelegateChange {
  const delegateChangeId = `${event.block.timestamp.toI64()}-${event.logIndex}`;

  const delegateChange = new DelegateChange(delegateChangeId);

  delegateChange.delegate = toDelegate;
  delegateChange.delegator = delegator;
  delegateChange.previousDelegate = fromDelegate;
  delegateChange.tokenAddress = event.address.toHexString();
  delegateChange.txnHash = event.transaction.hash.toHexString();
  delegateChange.blockNumber = event.block.number;
  delegateChange.blockTimestamp = event.block.timestamp;
  delegateChange.logIndex = event.logIndex;

  return delegateChange;
}

export function createDelegateVotingPowerChange(
  event: ethereum.Event,
  previousBalance: BigInt,
  newBalance: BigInt,
  delegate: string
): DelegateVotingPowerChange {
  const delegateVotingPwerChangeId = `${event.block.timestamp.toI64()}-${
    event.logIndex
  }`;

  const delegateVPChange = new DelegateVotingPowerChange(
    delegateVotingPwerChangeId
  );

  delegateVPChange.previousBalance = previousBalance;
  delegateVPChange.newBalance = newBalance;
  delegateVPChange.delegate = delegate;
  delegateVPChange.tokenAddress = event.address.toHexString();
  delegateVPChange.txnHash = event.transaction.hash.toHexString();
  delegateVPChange.blockTimestamp = event.block.timestamp;
  delegateVPChange.logIndex = event.logIndex;
  delegateVPChange.blockNumber = event.block.number;

  return delegateVPChange;
}

export function getProposal(id: string, contractAddress: string): Proposal {
  let proposalId = contractAddress.concat("-").concat(id);
  let proposal = Proposal.load(proposalId);
  if (!proposal) {
    proposal = new Proposal(proposalId);
    let rTokenContract = RTokenContract.load(contractAddress)!;
    proposal.governance = rTokenContract.rToken;
    proposal.tokenHoldersAtStart = BIGINT_ZERO;
    proposal.delegatesAtStart = BIGINT_ZERO;
  }

  return proposal as Proposal;
}

export function getOrCreateDelegate(
  address: string,
  governor: string
): Delegate {
  let delegateId = governor.concat("-").concat(address);
  let delegate = Delegate.load(delegateId);
  if (!delegate) {
    delegate = new Delegate(delegateId);
    delegate.address = address;
    delegate.delegatedVotesRaw = BIGINT_ZERO;
    delegate.delegatedVotes = BIGDECIMAL_ZERO;
    delegate.tokenHoldersRepresentedAmount = 0;
    delegate.numberVotes = 0;
    delegate.governance = governor;
    delegate.save();

    if (address != ZERO_ADDRESS) {
      const governance = getGovernance(governor);
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.save();
    }
  }

  return delegate as Delegate;
}

export function getOrCreateTokenHolder(
  address: string,
  governor: string
): TokenHolder {
  let holderId = governor.concat("-").concat(address);
  let tokenHolder = TokenHolder.load(holderId);
  if (!tokenHolder) {
    tokenHolder = new TokenHolder(holderId);
    tokenHolder.address = address;
    tokenHolder.tokenBalanceRaw = BIGINT_ZERO;
    tokenHolder.tokenBalance = BIGDECIMAL_ZERO;
    tokenHolder.totalTokensHeldRaw = BIGINT_ZERO;
    tokenHolder.totalTokensHeld = BIGDECIMAL_ZERO;
    tokenHolder.governance = governor;
    tokenHolder.save();

    if (address != ZERO_ADDRESS) {
      const governance = getGovernance(governor);
      governance.totalTokenHolders = governance.totalTokenHolders.plus(
        BIGINT_ONE
      );
      governance.save();
    }
  }

  return tokenHolder as TokenHolder;
}

export function getOrCreateTokenDailySnapshot(
  governor: string,
  block: ethereum.Block
): stTokenDailySnapshot {
  const snapshotId = governor
    .concat("-")
    .concat((block.timestamp.toI64() / SECONDS_PER_DAY).toString());
  const previousSnapshot = stTokenDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as stTokenDailySnapshot;
  }
  const snapshot = new stTokenDailySnapshot(snapshotId);
  snapshot.governance = governor;
  return snapshot;
}

export function getOrCreateVoteDailySnapshot(
  proposal: Proposal,
  block: ethereum.Block
): VoteDailySnapshot {
  const snapshotId =
    proposal.id + "-" + (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  const previousSnapshot = VoteDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as VoteDailySnapshot;
  }
  const snapshot = new VoteDailySnapshot(snapshotId);
  return snapshot;
}

export function _handleProposalCreated(
  proposalId: string,
  proposerAddr: string,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  startBlock: BigInt,
  endBlock: BigInt,
  description: string,
  quorum: BigInt,
  event: ethereum.Event
): void {
  const proposal = getProposal(proposalId, event.address.toHexString());
  let proposer = getOrCreateDelegate(proposerAddr, proposal.governance);

  // Checking if the proposer was a delegate already accounted for, if not we should log an error
  // since it shouldn't be possible for a delegate to propose anything without first being "created"
  if (proposer == null) {
    log.error(
      "Delegate participant {} not found on ProposalCreated. tx_hash: {}",
      [proposerAddr, event.transaction.hash.toHexString()]
    );
  }

  // Creating it anyway since we will want to account for this event data, even though it should've never happened
  proposer = getOrCreateDelegate(proposerAddr, proposal.governance);

  proposal.proposer = proposer.id;
  proposal.txnHash = event.transaction.hash.toHexString();
  proposal.againstDelegateVotes = BIGINT_ZERO;
  proposal.forDelegateVotes = BIGINT_ZERO;
  proposal.abstainDelegateVotes = BIGINT_ZERO;
  proposal.totalDelegateVotes = BIGINT_ZERO;
  proposal.againstWeightedVotes = BIGINT_ZERO;
  proposal.forWeightedVotes = BIGINT_ZERO;
  proposal.abstainWeightedVotes = BIGINT_ZERO;
  proposal.totalWeightedVotes = BIGINT_ZERO;
  proposal.targets = addressesToStrings(targets);
  proposal.values = values;
  proposal.signatures = signatures;
  proposal.calldatas = calldatas;
  proposal.creationBlock = event.block.number;
  proposal.creationTime = event.block.timestamp;
  proposal.startBlock = startBlock;
  proposal.endBlock = endBlock;
  proposal.description = description;
  proposal.state =
    event.block.number >= proposal.startBlock
      ? ProposalState.ACTIVE
      : ProposalState.PENDING;
  proposal.governanceFramework = event.address.toHexString();
  proposal.quorumVotes = quorum;
  proposal.save();

  // Increment gov proposal count
  const governance = getGovernance(proposal.governance);
  governance.proposals = governance.proposals.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalCanceled(
  proposalId: string,
  event: ethereum.Event
): void {
  const proposal = getProposal(proposalId, event.address.toHexString());
  proposal.state = ProposalState.CANCELED;
  proposal.cancellationTxnHash = event.transaction.hash.toHexString();
  proposal.cancellationBlock = event.block.number;
  proposal.cancellationTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  const governance = getGovernance(proposal.governance);
  governance.proposalsCanceled = governance.proposalsCanceled.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalExecuted(
  proposalId: string,
  event: ethereum.Event
): void {
  // Update proposal status + execution metadata
  const proposal = getProposal(proposalId, event.address.toHexString());
  proposal.state = ProposalState.EXECUTED;
  proposal.executionTxnHash = event.transaction.hash.toHexString();
  proposal.executionBlock = event.block.number;
  proposal.executionTime = event.block.timestamp;
  proposal.save();

  // Update governance proposal state counts
  const governance = getGovernance(proposal.governance);
  governance.proposalsQueued = governance.proposalsQueued.minus(BIGINT_ONE);
  governance.proposalsExecuted = governance.proposalsExecuted.plus(BIGINT_ONE);
  governance.save();
}

export function _handleProposalExtended(
  proposalId: string,
  contractAddress: string,
  extendedDeadline: BigInt
): void {
  // Update proposal endBlock
  const proposal = getProposal(proposalId, contractAddress);
  proposal.endBlock = extendedDeadline;
  proposal.save();
}

export function _handleProposalQueued(
  proposalId: BigInt,
  eta: BigInt,
  event: ethereum.Event
): void {
  let GovernanceFramework = getGovernanceFramework(
    event.address.toHexString(),
    event.block.number
  );
  let timelockContract = Timelock.bind(
    Address.fromString(GovernanceFramework.timelockAddress)
  );
  let executionDelay = timelockContract.try_getMinDelay();

  // Update proposal status + execution metadata
  const proposal = getProposal(
    proposalId.toString(),
    event.address.toHexString()
  );
  const governance = getGovernance(proposal.governance);

  proposal.state = ProposalState.QUEUED;
  proposal.queueTxnHash = event.transaction.hash.toHexString();
  proposal.queueBlock = event.block.number;
  proposal.queueTime = event.block.timestamp;
  proposal.executionETA = eta;
  if (!executionDelay.reverted) {
    proposal.executionStartBlock = event.block.number.plus(
      executionDelay.value.div(BigInt.fromI32(12))
    );
  }
  proposal.save();

  // Update governance proposal state counts
  governance.proposalsQueued = governance.proposalsQueued.plus(BIGINT_ONE);
  governance.save();
}

export function _handleVoteCast(
  proposal: Proposal,
  voterAddress: string,
  weight: BigInt,
  reason: string,
  support: i32,
  event: ethereum.Event
): void {
  const voteId = voterAddress.concat("-").concat(proposal.id);
  const vote = new Vote(voteId);
  vote.proposal = proposal.id;
  vote.voter = proposal.governance.concat("-").concat(voterAddress);
  vote.weight = weight;
  vote.reason = reason;
  vote.block = event.block.number;
  vote.blockTime = event.block.timestamp;
  vote.txnHash = event.transaction.hash.toHexString();
  vote.logIndex = event.logIndex;
  // Retrieve enum string key by value (0 = Against, 1 = For, 2 = Abstain)
  vote.choice = getVoteChoiceByValue(support);
  vote.blockTimeId = `${event.block.timestamp.toI64()}-${event.logIndex}`;
  vote.save();

  // Increment respective vote choice counts
  // NOTE: We are counting the weight instead of individual votes
  if (support === VoteChoice.AGAINST_VALUE) {
    proposal.againstDelegateVotes = proposal.againstDelegateVotes.plus(
      BIGINT_ONE
    );
    proposal.againstWeightedVotes = proposal.againstWeightedVotes.plus(weight);
  } else if (support === VoteChoice.FOR_VALUE) {
    proposal.forDelegateVotes = proposal.forDelegateVotes.plus(BIGINT_ONE);
    proposal.forWeightedVotes = proposal.forWeightedVotes.plus(weight);
  } else if (support === VoteChoice.ABSTAIN_VALUE) {
    proposal.abstainDelegateVotes = proposal.abstainDelegateVotes.plus(
      BIGINT_ONE
    );
    proposal.abstainWeightedVotes = proposal.abstainWeightedVotes.plus(weight);
  }
  // Increment total
  proposal.totalDelegateVotes = proposal.totalDelegateVotes.plus(BIGINT_ONE);
  proposal.totalWeightedVotes = proposal.totalWeightedVotes.plus(weight);
  proposal.save();

  // Add 1 to participant's proposal voting count
  const voter = getOrCreateDelegate(voterAddress, proposal.governance);
  voter.numberVotes = voter.numberVotes + 1;
  voter.save();

  // Take snapshot
  const dailySnapshot = getOrCreateVoteDailySnapshot(proposal, event.block);
  dailySnapshot.proposal = proposal.id;
  dailySnapshot.forWeightedVotes = proposal.forWeightedVotes;
  dailySnapshot.againstWeightedVotes = proposal.againstWeightedVotes;
  dailySnapshot.abstainWeightedVotes = proposal.abstainWeightedVotes;
  dailySnapshot.totalWeightedVotes = proposal.totalWeightedVotes;
  dailySnapshot.blockNumber = event.block.number;
  dailySnapshot.timestamp = event.block.timestamp;
  dailySnapshot.save();
}
