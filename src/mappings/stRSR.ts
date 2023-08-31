import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { RToken } from "../../generated/schema";
import {
  ExchangeRateSet,
  Staked,
  UnstakingCancelled,
  UnstakingCompleted,
  UnstakingStarted,
} from "../../generated/templates/stRSR/stRSR";
import {
  getOrCreateEntry,
  getOrCreateRTokenAccount,
  getOrCreateRTokenDailySnapshot,
  getOrCreateRTokenHourlySnapshot,
  getOrCreateRewardToken,
  getOrCreateStakeRecord,
} from "../common/getters";
import {
  updateRTokenAccountBalance,
  updateRTokenMetrics,
} from "../common/metrics";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import {
  _handleDelegateChanged,
  _handleDelegateVotesChanged,
  _handleTransfer,
} from "../governance/tokenHandlers";
import {
  DelegateChanged,
  DelegateVotesChanged,
  Transfer,
} from "./../../generated/templates/stRSRVotes/stRSRVotes";

import { BIGINT_ZERO, EntryType } from "./../common/constants";

function _handleStake(
  accountAddress: Address,
  rTokenAddress: Address,
  amount: BigInt,
  rsrAmount: BigInt,
  event: ethereum.Event
): void {
  updateRTokenAccountBalance(
    accountAddress,
    rTokenAddress,
    amount,
    rsrAmount,
    event
  );

  let rToken = RToken.load(rTokenAddress.toHexString())!; // Load rToken to get RSR price

  let entry = getOrCreateEntry(
    event,
    rTokenAddress.toHexString(),
    accountAddress.toHexString(),
    rsrAmount,
    EntryType.STAKE
  );

  entry.amountUSD = bigIntToBigDecimal(rsrAmount).times(rToken.rsrPriceUSD);
  entry.rToken = rTokenAddress.toHexString();
  entry.stAmount = amount;
  entry.save();

  getOrCreateStakeRecord(
    accountAddress,
    rTokenAddress,
    amount,
    rsrAmount,
    rToken.rawRsrExchangeRate,
    rToken.rsrPriceUSD,
    true,
    event
  );

  updateRTokenMetrics(event, rTokenAddress, rsrAmount, EntryType.STAKE);
}

function _handleUnstake(
  accountAddress: Address,
  rTokenAddress: Address,
  amount: BigInt,
  rsrAmount: BigInt,
  event: ethereum.Event
): void {
  updateRTokenAccountBalance(
    accountAddress,
    rTokenAddress,
    BIGINT_ZERO.minus(amount),
    rsrAmount,
    event
  );

  // Load rToken to get RSR price
  let rToken = RToken.load(rTokenAddress.toHexString())!;

  let entry = getOrCreateEntry(
    event,
    rTokenAddress.toHexString(),
    accountAddress.toHexString(),
    rsrAmount,
    EntryType.WITHDRAW
  );
  entry.amountUSD = bigIntToBigDecimal(rsrAmount).times(rToken.rsrPriceUSD);
  entry.rToken = rTokenAddress.toHexString();
  entry.save();

  updateRTokenMetrics(event, rTokenAddress, rsrAmount, EntryType.WITHDRAW);

  getOrCreateStakeRecord(
    accountAddress,
    rTokenAddress,
    amount,
    rsrAmount,
    rToken.rawRsrExchangeRate,
    rToken.rsrPriceUSD,
    false,
    event
  );
}

/** Staking mapping */
export function handleStake(event: Staked): void {
  let rTokenId = getRTokenId(event.address);

  if (rTokenId) {
    _handleStake(
      event.params.staker,
      Address.fromString(rTokenId),
      event.params.stRSRAmount,
      event.params.rsrAmount,
      event
    );
  }
}

export function handleUnstakeStarted(event: UnstakingStarted): void {
  let rTokenId = getRTokenId(event.address);

  // Avoid error, but is this needed? it should always exist
  if (rTokenId) {
    let accountBalance = getOrCreateRTokenAccount(
      event.params.staker,
      Address.fromString(rTokenId)
    );
    accountBalance.pendingUnstake = accountBalance.pendingUnstake.plus(
      event.params.stRSRAmount
    );
    accountBalance.save();

    updateRTokenMetrics(
      event,
      Address.fromString(rTokenId),
      event.params.rsrAmount,
      EntryType.UNSTAKE
    );

    // Load rToken to get RSR price
    let rToken = RToken.load(rTokenId)!;

    let entry = getOrCreateEntry(
      event,
      rTokenId,
      event.params.staker.toHexString(),
      event.params.rsrAmount,
      EntryType.UNSTAKE
    );

    entry.rToken = rTokenId;
    entry.stAmount = event.params.stRSRAmount;
    entry.amountUSD = bigIntToBigDecimal(event.params.rsrAmount).times(
      rToken.rsrPriceUSD
    );
    entry.save();
  }
}

export function handleUnstakeCancel(event: UnstakingCancelled): void {
  let rTokenId = getRTokenId(event.address);

  if (rTokenId) {
    // Load rToken to get RSR price
    let rToken = RToken.load(rTokenId)!;

    let entry = getOrCreateEntry(
      event,
      rTokenId,
      event.params.staker.toHexString(),
      event.params.rsrAmount,
      EntryType.UNSTAKE_CANCELLED
    );

    entry.rToken = rTokenId;
    entry.amount = event.params.rsrAmount;
    entry.amountUSD = bigIntToBigDecimal(event.params.rsrAmount).times(
      rToken.rsrPriceUSD
    );
    entry.save();

    let accountBalance = getOrCreateRTokenAccount(
      event.params.staker,
      Address.fromString(rTokenId)
    );
    accountBalance.pendingUnstake = BIGINT_ZERO;
    accountBalance.save();

    updateRTokenMetrics(
      event,
      Address.fromString(rTokenId),
      event.params.rsrAmount,
      EntryType.UNSTAKE_CANCELLED
    );
  }
}

export function handleUnstake(event: UnstakingCompleted): void {
  let rTokenId = getRTokenId(event.address);

  // Avoid error, but is this needed? it should always exist
  if (rTokenId) {
    const rTokenAddress = Address.fromString(rTokenId);

    // Grab st balance from pendingUnstake and update record
    let accountBalance = getOrCreateRTokenAccount(
      event.params.staker,
      rTokenAddress
    );
    let stAmount = accountBalance.pendingUnstake;
    accountBalance.pendingUnstake = BIGINT_ZERO;
    accountBalance.save();

    _handleUnstake(
      event.params.staker,
      rTokenAddress,
      stAmount,
      event.params.rsrAmount,
      event
    );
  }
}

export function handleExchangeRate(event: ExchangeRateSet): void {
  let rTokenId = getRTokenId(event.address);

  if (rTokenId) {
    let rToken = RToken.load(rTokenId)!;
    let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
    let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

    rToken.rsrExchangeRate = bigIntToBigDecimal(event.params.newVal);
    rToken.rawRsrExchangeRate = event.params.newVal;
    rToken.save();

    daily.rsrExchangeRate = rToken.rsrExchangeRate;
    hourly.rsrExchangeRate = rToken.rsrExchangeRate;

    daily.save();
    hourly.save();
  }
}

/** Governance mapping */

// DelegateChanged(indexed address,indexed address,indexed address)
export function handleDelegateChanged(event: DelegateChanged): void {
  _handleDelegateChanged(
    event.params.delegator.toHexString(),
    event.params.fromDelegate.toHexString(),
    event.params.toDelegate.toHexString(),
    event
  );
}

// DelegateVotesChanged(indexed address,uint256,uint256)
// Called in succession to the above DelegateChanged event
export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  _handleDelegateVotesChanged(
    event.params.delegate.toHexString(),
    event.params.previousBalance,
    event.params.newBalance,
    event
  );
}

// // Transfer(indexed address,indexed address,uint256)
export function handleTransfer(event: Transfer): void {
  _handleTransfer(
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.params.value,
    event
  );

  let rTokenId = getRTokenId(event.address);

  if (rTokenId) {
    let rToken = RToken.load(rTokenId)!;
    let rsrAmount = event.params.value.times(rToken.rawRsrExchangeRate);

    updateRTokenAccountBalance(
      event.params.from,
      Address.fromString(rTokenId),
      BIGINT_ZERO.minus(event.params.value),
      rsrAmount,
      event
    );
    updateRTokenAccountBalance(
      event.params.to,
      Address.fromString(rTokenId),
      event.params.value,
      rsrAmount,
      event
    );
  }
}

function getRTokenId(rewardTokenAddress: Address): string | null {
  let rewardToken = getOrCreateRewardToken(rewardTokenAddress);
  return rewardToken.rToken;
}
