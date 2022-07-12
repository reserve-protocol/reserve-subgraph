import { hour } from "./../common/utils/datetime";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  EntryType,
  INT_ONE,
} from "./../common/constants";
import { Account, RewardToken, RToken } from "../../generated/schema";
import {
  RToken as RTokenTemplate,
  stRSR as stRSRTemplate,
} from "../../generated/templates";
import {
  Transfer as TransferEvent,
  IssuanceStarted,
  IssuancesCanceled,
  IssuancesCompleted,
  Redemption,
  BasketsNeededChanged,
} from "../../generated/templates/RToken/RToken";
import {
  Staked,
  UnstakingStarted,
  UnstakingCompleted,
  ExchangeRateSet,
} from "../../generated/templates/stRSR/stRSR";
import {
  getOrCreateEntry,
  getOrCreateProtocol,
  getOrCreateRewardToken,
  getOrCreateRTokenDailySnapshot,
  getOrCreateRTokenHourlySnapshot,
  getOrCreateToken,
  getTokenAccount,
} from "../common/getters";
import { RTokenCreated } from "./../../generated/Deployer/Deployer";
import { BigInt } from "@graphprotocol/graph-ts";
import { handleTransfer } from "./common";
import {
  updateRTokenMetrics,
  updateRTokenUniqueUsers,
} from "../common/metrics";

// * Deployer events
export function handleCreateToken(event: RTokenCreated): void {
  let protocol = getOrCreateProtocol();

  // Create related tokens
  let token = getOrCreateToken(event.params.rToken);
  let rewardToken = getOrCreateRewardToken(event.params.stRSR);

  // Create new RToken
  let rToken = new RToken(event.params.rToken.toHexString());
  rToken.protocol = protocol.id;
  rToken.token = token.id;
  rToken.rewardToken = rewardToken.id;
  rToken.createdTimestamp = event.block.timestamp;
  rToken.createdBlockNumber = event.block.number;
  rToken.cumulativeUniqueUsers = INT_ONE;
  rToken.rewardTokenSupply = BIGINT_ZERO;
  // TODO: RSR PRICE USD
  rToken.rsrExchangeRate = BIGINT_ONE;
  rToken.insurance = BIGINT_ZERO;
  rToken.rsrStaked = BIGINT_ZERO;
  rToken.rsrUnstaked = BIGINT_ZERO;
  rToken.basketUnits = BigInt.fromString("100");
  rToken.save();

  // Initialize dynamic mappings for the new RToken system
  RTokenTemplate.create(event.params.rToken);
  stRSRTemplate.create(event.params.stRSR);
}

export function handleTokenTransfer(event: TransferEvent): void {
  handleTransfer(event);
}

// * rToken Events
export function handleIssuanceStart(event: IssuanceStarted): void {
  let account = getTokenAccount(event.params.issuer, event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    event.params.amount,
    EntryType.ISSUE_START
  );
  entry.rToken = event.address.toHexString();
  entry.save();

  updateRTokenMetrics(event, event.address, BIGINT_ZERO, EntryType.ISSUE_START);
}

export function handleIssuanceCancel(event: IssuancesCanceled): void {
  let account = getTokenAccount(event.params.issuer, event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    BIGINT_ZERO, // TODO: Maybe worth to send the amount on the event
    EntryType.CANCEL_ISSUANCE
  );
  entry.rToken = event.address.toHexString();
  entry.save();

  updateRTokenMetrics(event, event.address, BIGINT_ZERO, EntryType.ISSUE);
}

export function handleIssuance(event: IssuancesCompleted): void {
  let account = getTokenAccount(event.params.issuer, event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    BIGINT_ZERO, // TODO: Maybe worth to send the amount on the event
    EntryType.ISSUE
  );
  entry.rToken = event.address.toHexString();
  entry.save();

  updateRTokenMetrics(event, event.address, BIGINT_ZERO, EntryType.ISSUE);
}

export function handleRedemption(event: Redemption): void {
  let account = getTokenAccount(event.params.redeemer, event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    BIGINT_ZERO, // TODO: Maybe worth to send the amount on the event
    EntryType.ISSUE
  );
  entry.rToken = event.address.toHexString();
  entry.save();

  updateRTokenMetrics(event, event.address, BIGINT_ZERO, EntryType.ISSUE);
}

// * stRSR Events
export function handleStake(event: Staked): void {
  let rewardToken = RewardToken.load(event.address.toHexString());
  let rTokenId = rewardToken.rToken;

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
      event.params.rsrAmount,
      EntryType.STAKE
    );
    entry.rToken = rTokenId;
    entry.stAmount = event.params.stRSRAmount;
    entry.save();

    updateRTokenMetrics(
      event,
      event.address,
      event.params.rsrAmount,
      EntryType.STAKE
    );
  }
}

export function handleUnstakeStarted(event: UnstakingStarted): void {
  let rewardToken = RewardToken.load(event.address.toHexString());
  let rTokenId = rewardToken.rToken;

  // Avoid error, but is this needed? it should always exist
  if (rTokenId) {
    let entry = getOrCreateEntry(
      event,
      rTokenId,
      event.params.staker.toHexString(),
      event.params.rsrAmount,
      EntryType.UNSTAKE
    );
    entry.rToken = rTokenId;
    entry.stAmount = event.params.stRSRAmount;
    entry.save();

    updateRTokenMetrics(
      event,
      event.address,
      event.params.rsrAmount,
      EntryType.UNSTAKE
    );
  }
}

export function handleUnstake(event: UnstakingCompleted): void {
  let rewardToken = RewardToken.load(event.address.toHexString());
  let rTokenId = rewardToken.rToken;

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
      event.params.rsrAmount,
      EntryType.STAKE
    );
    entry.rToken = rTokenId;
    entry.save();

    updateRTokenMetrics(
      event,
      event.address,
      event.params.rsrAmount,
      EntryType.STAKE
    );
  }
}

// * Rewards
export function handleRTokenBaskets(event: BasketsNeededChanged): void {
  let rToken = RToken.load(event.address.toHexString())!;
  let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  rToken.basketUnits = event.params.newBasketsNeeded;
  daily.basketUnits = rToken.basketUnits;
  hourly.basketUnits = rToken.basketUnits;

  rToken.save();
  daily.save();
  hourly.save();
}

export function handleExchangeRate(event: ExchangeRateSet): void {
  let rewardToken = getOrCreateRewardToken(event.address);
  let rToken = RToken.load(rewardToken.rToken);

  if (rToken) {
    let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
    let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

    rToken.rsrExchangeRate = event.params.newVal;
    daily.rsrExchangeRate = rToken.basketUnits;
    hourly.rsrExchangeRate = rToken.basketUnits;

    rToken.save();
    daily.save();
    hourly.save();
  }
}
