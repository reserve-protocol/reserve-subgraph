import { Address, log } from "@graphprotocol/graph-ts";
import { Account, RToken, Token } from "../../generated/schema";
import {
  RToken as RTokenTemplate,
  stRSR as stRSRTemplate,
} from "../../generated/templates";
import {
  BasketsNeededChanged,
  IssuancesCanceled,
  IssuancesCompleted,
  IssuanceStarted,
  Redemption,
  Transfer as TransferEvent,
} from "../../generated/templates/RToken/RToken";
import {
  ExchangeRateSet,
  Staked,
  UnstakingCompleted,
  UnstakingStarted,
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
import {
  updateRTokenAccountBalance,
  updateRTokenMetrics,
  updateRTokenUniqueUsers,
} from "../common/metrics";
import { getRSRPrice } from "../common/tokens";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { RTokenCreated } from "./../../generated/Deployer/Deployer";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  EntryType,
  INT_ONE,
} from "./../common/constants";
import { handleTransfer } from "./common";

// * Deployer events
export function handleCreateToken(event: RTokenCreated): void {
  let protocol = getOrCreateProtocol();

  // Create related tokens
  let token = getOrCreateToken(event.params.rToken);
  let rewardToken = getOrCreateRewardToken(event.params.stRSR);
  let stToken = Token.load(event.params.stRSR.toHexString())!;

  // Create new RToken
  let rToken = new RToken(event.params.rToken.toHexString());
  rToken.protocol = protocol.id;
  rToken.token = token.id;
  rToken.rewardToken = rewardToken.id;
  rToken.createdTimestamp = event.block.timestamp;
  rToken.createdBlockNumber = event.block.number;
  rToken.cumulativeUniqueUsers = INT_ONE;
  rToken.rewardTokenSupply = BIGINT_ZERO;
  rToken.rsrPriceUSD = getRSRPrice();
  rToken.rsrPriceLastBlock = event.block.number;
  rToken.rsrExchangeRate = BIGINT_ONE;
  rToken.insurance = BIGINT_ZERO;
  rToken.rsrStaked = BIGINT_ZERO;
  rToken.rsrUnstaked = BIGINT_ZERO;
  rToken.basketUnits = BIGINT_ZERO;
  rToken.backing = BIGINT_ZERO;
  rToken.backingInsurance = BIGINT_ZERO;
  rToken.save();

  token.rToken = rToken.id;
  token.save();

  rewardToken.rToken = rToken.id;
  rewardToken.save();

  stToken.rToken = rToken.id;
  stToken.save();

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
  let token = getOrCreateToken(event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    event.params.amount,
    EntryType.ISSUE_START
  );
  entry.amountUSD = bigIntToBigDecimal(event.params.amount).times(
    token.lastPriceUSD
  );
  entry.rToken = event.address.toHexString();
  entry.save();

  updateRTokenMetrics(
    event,
    event.address,
    event.params.amount,
    EntryType.ISSUE_START
  );
}

export function handleIssuanceCancel(event: IssuancesCanceled): void {
  let account = getTokenAccount(event.params.issuer, event.address);
  let token = getOrCreateToken(event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    event.params.amount,
    EntryType.CANCEL_ISSUANCE
  );
  entry.rToken = event.address.toHexString();
  entry.amountUSD = bigIntToBigDecimal(event.params.amount).times(
    token.lastPriceUSD
  );
  entry.save();

  updateRTokenMetrics(
    event,
    event.address,
    event.params.amount,
    EntryType.CANCEL_ISSUANCE
  );
}

export function handleIssuance(event: IssuancesCompleted): void {
  let account = getTokenAccount(event.params.issuer, event.address);
  let token = getOrCreateToken(event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    event.params.amount,
    EntryType.ISSUE
  );
  entry.rToken = event.address.toHexString();
  entry.amountUSD = bigIntToBigDecimal(event.params.amount).times(
    token.lastPriceUSD
  );
  entry.save();

  updateRTokenMetrics(
    event,
    event.address,
    event.params.amount,
    EntryType.ISSUE
  );
}

export function handleRedemption(event: Redemption): void {
  let account = getTokenAccount(event.params.redeemer, event.address);
  let token = getOrCreateToken(event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    event.params.amount,
    EntryType.ISSUE
  );
  entry.rToken = event.address.toHexString();
  entry.amountUSD = bigIntToBigDecimal(BIGINT_ZERO).times(token.lastPriceUSD);
  entry.save();

  updateRTokenMetrics(event, event.address, BIGINT_ZERO, EntryType.REDEEM);
}

// * stRSR Events
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
      event.params.rsrAmount,
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

// * Rewards
export function handleRTokenBaskets(event: BasketsNeededChanged): void {
  let rToken = RToken.load(event.address.toHexString())!;
  let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  rToken.basketUnits = event.params.newBasketsNeeded;
  rToken.save();

  daily.basketUnits = rToken.basketUnits;
  hourly.basketUnits = rToken.basketUnits;

  daily.save();
  hourly.save();
}

export function handleExchangeRate(event: ExchangeRateSet): void {
  let rTokenId = getRTokenId(event.address);

  if (rTokenId) {
    let rToken = RToken.load(rTokenId)!;
    let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
    let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

    rToken.rsrExchangeRate = event.params.newVal;
    rToken.save();

    daily.rsrExchangeRate = event.params.newVal;
    hourly.rsrExchangeRate = event.params.newVal;

    daily.save();
    hourly.save();
  }
}

function getRTokenId(rewardTokenAddress: Address): string | null {
  let rewardToken = getOrCreateRewardToken(rewardTokenAddress);
  return rewardToken.rToken;
}
