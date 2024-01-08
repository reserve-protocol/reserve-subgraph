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
  getTokenWithRefreshedPrice,
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

import {
  BIGINT_TEN_TO_EIGHTEENTH,
  BIGINT_ZERO,
  EntryType,
  RSR_ADDRESS,
  ZERO_ADDRESS,
} from "./../common/constants";
import { getRSRPrice } from "../common/tokens";

function _handleStake(
  accountAddress: Address,
  rTokenAddress: Address,
  amount: BigInt,
  rsrAmount: BigInt,
  event: ethereum.Event,
  createEntry: boolean = true
): void {
  updateRTokenAccountBalance(
    accountAddress,
    rTokenAddress,
    amount,
    rsrAmount,
    event
  );

  let rToken = RToken.load(rTokenAddress.toHexString())!; // Load rToken to get RSR price
  let rsr = getTokenWithRefreshedPrice(RSR_ADDRESS, event.block.number);

  if (createEntry) {
    let entry = getOrCreateEntry(
      event,
      rTokenAddress.toHexString(),
      accountAddress.toHexString(),
      rsrAmount,
      EntryType.STAKE
    );

    entry.amountUSD = bigIntToBigDecimal(rsrAmount).times(rsr.lastPriceUSD);
    entry.rToken = rTokenAddress.toHexString();
    entry.stAmount = amount;
    entry.save();
  }

  getOrCreateStakeRecord(
    accountAddress,
    rTokenAddress,
    amount,
    rsrAmount,
    rToken.rawRsrExchangeRate,
    rsr.lastPriceUSD,
    true,
    event
  );
}

function _handleUnstake(
  accountAddress: Address,
  rTokenAddress: Address,
  amount: BigInt,
  rsrAmount: BigInt,
  event: ethereum.Event,
  createEntry: boolean = true
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
  let rsr = getTokenWithRefreshedPrice(RSR_ADDRESS, event.block.number);

  if (createEntry) {
    let entry = getOrCreateEntry(
      event,
      rTokenAddress.toHexString(),
      accountAddress.toHexString(),
      rsrAmount,
      EntryType.WITHDRAW
    );
    entry.amountUSD = bigIntToBigDecimal(rsrAmount).times(rsr.lastPriceUSD);
    entry.rToken = rTokenAddress.toHexString();
    entry.save();
  }

  getOrCreateStakeRecord(
    accountAddress,
    rTokenAddress,
    amount,
    rsrAmount,
    rToken.rawRsrExchangeRate,
    rsr.lastPriceUSD,
    false,
    event
  );
}

/** Staking mapping */
export function handleStake(event: Staked): void {
  let rTokenId = getRTokenId(event.address);

  if (rTokenId) {
    const rTokenAddress = Address.fromString(rTokenId);

    _handleStake(
      event.params.staker,
      rTokenAddress,
      event.params.stRSRAmount,
      event.params.rsrAmount,
      event
    );

    updateRTokenMetrics(
      event,
      rTokenAddress,
      event.params.rsrAmount,
      EntryType.STAKE
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

    updateRTokenMetrics(
      event,
      rTokenAddress,
      event.params.rsrAmount,
      EntryType.WITHDRAW
    );
  }
}

export function handleUnstakeStarted(event: UnstakingStarted): void {
  let rTokenId = getRTokenId(event.address);

  // Avoid error, but is this needed? it should always exist
  if (rTokenId) {
    let rsr = getTokenWithRefreshedPrice(RSR_ADDRESS, event.block.number);

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
      rsr.lastPriceUSD
    );
    entry.save();
  }
}

export function handleUnstakeCancel(event: UnstakingCancelled): void {
  let rTokenId = getRTokenId(event.address);

  if (rTokenId) {
    // Load rToken to get RSR price
    let rToken = RToken.load(rTokenId)!;
    let rsr = getTokenWithRefreshedPrice(RSR_ADDRESS, event.block.number);

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
      rsr.lastPriceUSD
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

  // Only track user transfers
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    let rTokenId = getRTokenId(event.address);

    if (rTokenId) {
      let rToken = RToken.load(rTokenId)!;

      let rsrAmount = event.params.value
        .times(rToken.rawRsrExchangeRate)
        .div(BIGINT_TEN_TO_EIGHTEENTH);

      _handleStake(
        event.params.to,
        Address.fromString(rTokenId),
        event.params.value,
        rsrAmount,
        event,
        false
      );

      _handleUnstake(
        event.params.from,
        Address.fromString(rTokenId),
        event.params.value,
        rsrAmount,
        event,
        false
      );
    }
  }
}

function getRTokenId(rewardTokenAddress: Address): string | null {
  let rewardToken = getOrCreateRewardToken(rewardTokenAddress);
  return rewardToken.rToken;
}
