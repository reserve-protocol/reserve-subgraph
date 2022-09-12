import { GnosisTrade } from "./../../generated/templates/BackingManager/GnosisTrade";
import { TradeStarted } from "./../../generated/templates/RevenueTrader/RevenueTrader";
import { Address } from "@graphprotocol/graph-ts";
import {
  Account,
  Trade,
  RToken,
  RTokenContract,
  Token,
} from "../../generated/schema";
import {
  RToken as RTokenTemplate,
  stRSR as stRSRTemplate,
  BackingManager,
  RevenueTrader,
} from "../../generated/templates";
import { RToken as _RToken } from "../../generated/templates/RToken/RToken";
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
import { Main } from "./../../generated/Deployer/Main";

import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
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
  rToken.rsrExchangeRate = BIGDECIMAL_ONE;
  rToken.insurance = BIGINT_ZERO;
  rToken.rsrStaked = BIGINT_ZERO;
  rToken.rsrUnstaked = BIGINT_ZERO;
  rToken.basketRate = BIGDECIMAL_ONE;
  rToken.backing = BIGINT_ZERO;
  rToken.backingInsurance = BIGINT_ZERO;
  rToken.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
  rToken.cumulativeInsuranceRevenueUSD = BIGDECIMAL_ZERO;
  rToken.save();

  token.rToken = rToken.id;
  token.save();

  rewardToken.rToken = rToken.id;
  rewardToken.save();

  stToken.rToken = rToken.id;
  stToken.save();

  let rTokenContract = _RToken.bind(event.params.rToken);
  let mainAddress = rTokenContract.main();
  let mainContract = Main.bind(mainAddress);

  let backingManagerAddress = mainContract.backingManager();
  let backingManager = new RTokenContract(backingManagerAddress.toHexString());
  backingManager.rToken = rToken.id;
  backingManager.save();

  let revenueTraderAddress = mainContract.rTokenTrader();
  let revenueTrader = new RTokenContract(revenueTraderAddress.toHexString());
  revenueTrader.rToken = rToken.id;
  revenueTrader.save();

  // Initialize dynamic mappings for the new RToken system
  RTokenTemplate.create(event.params.rToken);
  stRSRTemplate.create(event.params.stRSR);
  BackingManager.create(backingManagerAddress);
  RevenueTrader.create(revenueTraderAddress);
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
  let token = Token.load(rToken.token)!;
  let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  rToken.basketRate = token.totalSupply
    .div(event.params.newBasketsNeeded)
    .toBigDecimal();
  rToken.save();

  daily.basketRate = rToken.basketRate;
  hourly.basketRate = rToken.basketRate;

  daily.save();
  hourly.save();
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

export function handleTrade(event: TradeStarted): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let tradeContract = GnosisTrade.bind(event.address);
  let auctionId = tradeContract.auctionId();
  let worstCasePrice = tradeContract.worstCasePrice();
  let endAt = tradeContract.endTime();

  let trade = new Trade(event.params.trade.toHexString());
  trade.amount = bigIntToBigDecimal(event.params.sellAmount);
  trade.worstCasePrice = bigIntToBigDecimal(worstCasePrice);
  trade.auctionId = auctionId;
  trade.selling = event.params.sell.toHexString();
  trade.buying = event.params.buy.toHexString();
  trade.startedAt = event.block.timestamp;
  trade.endAt = endAt;
  trade.rToken = rTokenContract.rToken;

  trade.save();
}

function getRTokenId(rewardTokenAddress: Address): string | null {
  let rewardToken = getOrCreateRewardToken(rewardTokenAddress);
  return rewardToken.rToken;
}
