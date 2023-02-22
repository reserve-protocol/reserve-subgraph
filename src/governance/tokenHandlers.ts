import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { BIGINT_ONE, BIGINT_ZERO, ZERO_ADDRESS } from "../common/constants";
import { getOrCreateRewardToken } from "../common/getters";
import {
  getOrCreateTokenHolder,
  getOrCreateDelegate,
  createDelegateChange,
  toDecimal,
  createDelegateVotingPowerChange,
  getGovernance,
  getOrCreateTokenDailySnapshot,
} from "./handlers";

function getRTokenId(rewardTokenAddress: Address): string | null {
  let rewardToken = getOrCreateRewardToken(rewardTokenAddress);
  return rewardToken.rToken;
}

export function _handleDelegateChanged(
  delegator: string,
  fromDelegate: string,
  toDelegate: string,
  event: ethereum.Event
): void {
  let governorId = getRTokenId(event.address)!;
  const tokenHolder = getOrCreateTokenHolder(delegator, governorId);
  const previousDelegate = getOrCreateDelegate(fromDelegate, governorId);
  const newDelegate = getOrCreateDelegate(toDelegate, governorId);

  tokenHolder.delegate = newDelegate.id;
  tokenHolder.save();

  previousDelegate.tokenHoldersRepresentedAmount =
    previousDelegate.tokenHoldersRepresentedAmount - 1;
  previousDelegate.save();

  newDelegate.tokenHoldersRepresentedAmount =
    newDelegate.tokenHoldersRepresentedAmount + 1;
  newDelegate.save();

  const delegateChanged = createDelegateChange(
    event,
    toDelegate,
    fromDelegate,
    delegator
  );

  delegateChanged.save();
}

export function _handleDelegateVotesChanged(
  delegateAddress: string,
  previousBalance: BigInt,
  newBalance: BigInt,
  event: ethereum.Event
): void {
  const votesDifference = newBalance.minus(previousBalance);
  let governorId = getRTokenId(event.address)!;

  const delegate = getOrCreateDelegate(delegateAddress, governorId);
  delegate.delegatedVotesRaw = newBalance;
  delegate.delegatedVotes = toDecimal(newBalance);
  delegate.save();

  // Create DelegateVotingPowerChange
  const delegateVPChange = createDelegateVotingPowerChange(
    event,
    previousBalance,
    newBalance,
    delegateAddress
  );
  delegateVPChange.save();

  // Update governance delegate count
  const governance = getGovernance(governorId);
  if (previousBalance == BIGINT_ZERO && newBalance > BIGINT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.plus(BIGINT_ONE);
  }
  if (newBalance == BIGINT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.minus(BIGINT_ONE);
  }
  governance.delegatedVotesRaw = governance.delegatedVotesRaw.plus(
    votesDifference
  );
  governance.delegatedVotes = toDecimal(governance.delegatedVotesRaw);
  governance.save();
}

export function _handleTransfer(
  from: string,
  to: string,
  value: BigInt,
  event: ethereum.Event
): void {
  let governorId = getRTokenId(event.address)!;
  const fromHolder = getOrCreateTokenHolder(from, governorId);
  const toHolder = getOrCreateTokenHolder(to, governorId);
  const governance = getGovernance(governorId);

  const isBurn = to == ZERO_ADDRESS;
  const isMint = from == ZERO_ADDRESS;

  if (!isMint) {
    const fromHolderPreviousBalance = fromHolder.tokenBalanceRaw;
    fromHolder.tokenBalanceRaw = fromHolder.tokenBalanceRaw.minus(value);
    fromHolder.tokenBalance = toDecimal(fromHolder.tokenBalanceRaw);

    if (fromHolder.tokenBalanceRaw < BIGINT_ZERO) {
      log.error("Negative balance on holder {} with balance {}", [
        fromHolder.id,
        fromHolder.tokenBalanceRaw.toString(),
      ]);
    }

    if (
      fromHolderPreviousBalance > BIGINT_ZERO &&
      fromHolder.tokenBalanceRaw == BIGINT_ZERO
    ) {
      governance.currentTokenHolders = governance.currentTokenHolders.minus(
        BIGINT_ONE
      );
      governance.save();
    }
    fromHolder.save();
  }

  // Increment to holder balance and total tokens ever held
  const toHolderPreviousBalance = toHolder.tokenBalanceRaw;
  toHolder.tokenBalanceRaw = toHolder.tokenBalanceRaw.plus(value);
  toHolder.tokenBalance = toDecimal(toHolder.tokenBalanceRaw);
  toHolder.totalTokensHeldRaw = toHolder.totalTokensHeldRaw.plus(value);
  toHolder.totalTokensHeld = toDecimal(toHolder.totalTokensHeldRaw);

  if (
    toHolderPreviousBalance == BIGINT_ZERO &&
    toHolder.tokenBalanceRaw > BIGINT_ZERO
  ) {
    governance.currentTokenHolders = governance.currentTokenHolders.plus(
      BIGINT_ONE
    );
    governance.save();
  }
  toHolder.save();

  // Adjust token total supply if it changes
  if (isMint) {
    governance.totalTokenSupply = governance.totalTokenSupply.plus(value);
    governance.save();
  } else if (isBurn) {
    governance.totalTokenSupply = governance.totalTokenSupply.minus(value);
    governance.save();
  }

  // Take snapshot
  const dailySnapshot = getOrCreateTokenDailySnapshot(governorId, event.block);
  dailySnapshot.totalSupply = governance.totalTokenSupply;
  dailySnapshot.tokenHolders = governance.currentTokenHolders;
  dailySnapshot.delegates = governance.currentDelegates;
  dailySnapshot.blockNumber = event.block.number;
  dailySnapshot.timestamp = event.block.timestamp;
  dailySnapshot.save();
}
