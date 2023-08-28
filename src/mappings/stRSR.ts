import {
  DelegateChanged,
  DelegateVotesChanged,
  Transfer,
} from "./../../generated/templates/stRSRVotes/stRSRVotes";
import { Address } from "@graphprotocol/graph-ts";
import { Account, RToken } from "../../generated/schema";
import {
  ExchangeRateSet,
  Staked,
  UnstakingCancelled,
  UnstakingCompleted,
  UnstakingStarted,
} from "../../generated/templates/stRSR/stRSR";
import {
  getOrCreateEntry,
  getOrCreateRewardToken,
  getOrCreateRTokenDailySnapshot,
  getOrCreateRTokenHourlySnapshot,
} from "../common/getters";
import {
  updateRTokenAccountBalance,
  updateRTokenMetrics,
  updateRTokenUniqueUsers,
} from "../common/metrics";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import {
  _handleDelegateChanged,
  _handleDelegateVotesChanged,
  _handleTransfer,
} from "../governance/tokenHandlers";

import { BIGINT_ZERO, EntryType } from "./../common/constants";

/** Staking mapping */

export function handleStake(event: Staked): void {
  let rTokenId = getRTokenId(event.address);

  // Avoid error, but is this needed? it should always exist
  if (rTokenId) {
    let account = Account.load(event.params.staker.toHexString());

    if (!account) {
      account = new Account(event.params.staker.toHexString());
      account.save();
      updateRTokenUniqueUsers(rTokenId);
    }

    let entry = getOrCreateEntry(
      event,
      rTokenId,
      account.id,
      event.params.stRSRAmount,
      EntryType.STAKE
    );

    updateRTokenAccountBalance(
      event.params.staker,
      Address.fromString(rTokenId),
      BIGINT_ZERO.plus(event.params.stRSRAmount),
      event
    );

    updateRTokenMetrics(
      event,
      Address.fromString(rTokenId),
      event.params.rsrAmount,
      EntryType.STAKE
    );

    // Load rToken to get RSR price
    let rToken = RToken.load(rTokenId)!;

    entry.amountUSD = bigIntToBigDecimal(event.params.rsrAmount).times(
      rToken.rsrPriceUSD
    );
    entry.rToken = rTokenId;
    entry.stAmount = event.params.stRSRAmount;
    entry.save();
  }
}

export function handleUnstakeStarted(event: UnstakingStarted): void {
  let rTokenId = getRTokenId(event.address);

  // Avoid error, but is this needed? it should always exist
  if (rTokenId) {
    updateRTokenAccountBalance(
      event.params.staker,
      Address.fromString(rTokenId),
      BIGINT_ZERO.minus(event.params.stRSRAmount),
      event
    );

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
    updateRTokenAccountBalance(
      event.params.staker,
      Address.fromString(rTokenId),
      BIGINT_ZERO.plus(event.params.rsrAmount),
      event
    );

    updateRTokenMetrics(
      event,
      Address.fromString(rTokenId),
      event.params.rsrAmount,
      EntryType.UNSTAKE_CANCELLED
    );

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
  }
}

export function handleUnstake(event: UnstakingCompleted): void {
  let rTokenId = getRTokenId(event.address);

  // Avoid error, but is this needed? it should always exist
  if (rTokenId) {
    let account = Account.load(event.params.staker.toHexString())!;
    let entry = getOrCreateEntry(
      event,
      rTokenId,
      account.id,
      event.params.rsrAmount,
      EntryType.WITHDRAW
    );

    updateRTokenMetrics(
      event,
      Address.fromString(rTokenId),
      event.params.rsrAmount,
      EntryType.WITHDRAW
    );

    // Load rToken to get RSR price
    let rToken = RToken.load(rTokenId)!;

    entry.amountUSD = bigIntToBigDecimal(event.params.rsrAmount).times(
      rToken.rsrPriceUSD
    );
    entry.rToken = rTokenId;
    entry.save();
  }
}

export function handleExchangeRate(event: ExchangeRateSet): void {
  let rTokenId = getRTokenId(event.address);

  if (rTokenId) {
    let rToken = RToken.load(rTokenId)!;
    let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
    let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

    rToken.rsrExchangeRate = bigIntToBigDecimal(event.params.newVal);
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
}

function getRTokenId(rewardTokenAddress: Address): string | null {
  let rewardToken = getOrCreateRewardToken(rewardTokenAddress);
  return rewardToken.rToken;
}
