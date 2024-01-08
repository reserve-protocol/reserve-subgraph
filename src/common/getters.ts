import { DutchTrade } from "./../../generated/templates/BackingManager/DutchTrade";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  AccountRToken,
  AccountRTokenDailySnapshot,
  AccountStakeRecord,
  Collateral,
  Deployer,
  FinancialsDailySnapshot,
  Protocol,
  RewardToken,
  RTokenContract,
  RTokenDailySnapshot,
  RTokenHourlySnapshot,
  Token,
  TokenDailySnapshot,
  TokenHourlySnapshot,
  Trade,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  Network,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SLUG,
  PROTOCOL_SUBGRAPH_VERSION,
  RewardTokenType,
  RSV_ADDRESS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  TradeKind,
} from "../common/constants";
import {
  AccountBalance,
  AccountBalanceDailySnapshot,
  Entry,
} from "./../../generated/schema";
import { updateRTokenUniqueUsers } from "./metrics";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./tokens";
import { GnosisTrade } from "../../generated/templates/BackingManager/GnosisTrade";
import {
  TradeSettled,
  TradeStarted,
} from "../../generated/templates/RevenueTrader/RevenueTrader";
import { bigIntToBigDecimal } from "./utils/numbers";

export function getOrCreateCollateral(address: Address): Collateral {
  let collateral = Collateral.load(address.toHexString());

  if (!collateral) {
    collateral = new Collateral(address.toHexString());
    collateral.symbol = fetchTokenSymbol(address);
    collateral.save();
  }

  return collateral;
}

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_SLUG);

  if (!protocol) {
    protocol = new Protocol(PROTOCOL_SLUG);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;

    protocol.rsrStaked = BIGINT_ZERO;
    protocol.rsrStakedUSD = BIGDECIMAL_ZERO;
    protocol.totalRsrStaked = BIGINT_ZERO;
    protocol.totalRsrStakedUSD = BIGDECIMAL_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
    protocol.rsrRevenue = BIGDECIMAL_ZERO;
    protocol.cumulativeRSRRevenueUSD = BIGDECIMAL_ZERO;
    protocol.transactionCount = BIGINT_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.network = Network.MAINNET;

    protocol.rsrStaked = BIGINT_ZERO;
    protocol.rsrStakedUSD = BIGDECIMAL_ZERO;
    protocol.totalRsrUnstaked = BIGINT_ZERO;
    protocol.totalRsrUnstakedUSD = BIGDECIMAL_ZERO;
    protocol.totalRTokenUSD = BIGDECIMAL_ZERO; // Maybe duplicated from cumulative volume
    protocol.rTokenCount = INT_ZERO;

    protocol.save();
  }
  return protocol;
}

export function getOrCreateDeployer(deployerAddress: Address): Deployer {
  let deployer = Deployer.load(deployerAddress.toHexString());

  // fetch info if null
  if (!deployer) {
    deployer = new Deployer(deployerAddress.toHexString());
    deployer.deployerVersion = "";
    deployer.blockNumber = BIGINT_ZERO;

    deployer.save();
  }
  return deployer;
}

export function getOrCreateUsageMetricDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = PROTOCOL_SLUG;

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;

    usageMetrics.dailyRSRStaked = BIGINT_ZERO;
    usageMetrics.dailyRSRStakedUSD = BIGDECIMAL_ZERO;
    usageMetrics.cumulativeRSRStaked = BIGINT_ZERO;
    usageMetrics.cumulativeRSRStakedUSD = BIGDECIMAL_ZERO;
    usageMetrics.dailyRSRUnstaked = BIGINT_ZERO;
    usageMetrics.dailyRSRUnstakedUSD = BIGDECIMAL_ZERO;
    usageMetrics.cumulativeRSRUnstaked = BIGINT_ZERO;
    usageMetrics.cumulativeRSRUnstakedUSD = BIGDECIMAL_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}
export function getOrCreateUsageMetricHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  let hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = PROTOCOL_SLUG;

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;

    usageMetrics.hourlyRSRStaked = BIGINT_ZERO;
    usageMetrics.hourlyRSRStakedUSD = BIGDECIMAL_ZERO;
    usageMetrics.cumulativeRSRStaked = BIGINT_ZERO;
    usageMetrics.cumulativeRSRStakedUSD = BIGDECIMAL_ZERO;
    usageMetrics.hourlyRSRUnstaked = BIGINT_ZERO;
    usageMetrics.hourlyRSRUnstakedUSD = BIGDECIMAL_ZERO;
    usageMetrics.cumulativeRSRUnstaked = BIGINT_ZERO;
    usageMetrics.cumulativeRSRUnstakedUSD = BIGDECIMAL_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = PROTOCOL_SLUG;

    financialMetrics.rsrStaked = BIGINT_ZERO;
    financialMetrics.rsrStakedUSD = BIGDECIMAL_ZERO;

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;

    financialMetrics.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeRSRRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalRTokenUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateRTokenDailySnapshot(
  rTokenAddress: string,
  event: ethereum.Event
): RTokenDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let rTokenMetrics = RTokenDailySnapshot.load(
    rTokenAddress.concat("-").concat(dayId)
  );

  if (!rTokenMetrics) {
    rTokenMetrics = new RTokenDailySnapshot(
      rTokenAddress.concat("-").concat(dayId)
    );
    rTokenMetrics.protocol = PROTOCOL_SLUG;
    rTokenMetrics.rToken = rTokenAddress;
    rTokenMetrics.blockNumber = event.block.number;
    rTokenMetrics.timestamp = event.block.timestamp;

    rTokenMetrics.dailyActiveUsers = INT_ZERO;
    rTokenMetrics.cumulativeUniqueUsers = INT_ZERO;
    rTokenMetrics.rsrStaked = BIGINT_ZERO;
    rTokenMetrics.rewardTokenSupply = BIGINT_ZERO;
    rTokenMetrics.dailyRSRStaked = BIGINT_ZERO;
    rTokenMetrics.dailyActiveUsers = INT_ZERO;
    rTokenMetrics.cumulativeRSRStaked = BIGINT_ZERO;
    rTokenMetrics.dailyRSRUnstaked = BIGINT_ZERO;
    rTokenMetrics.cumulativeRSRUnstaked = BIGINT_ZERO;
    rTokenMetrics.rsrExchangeRate = BIGDECIMAL_ZERO;
    rTokenMetrics.basketRate = BIGDECIMAL_ZERO;
    rTokenMetrics.dailyRTokenRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.dailyRSRRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.cumulativeRSRRevenueUSD = BIGDECIMAL_ZERO;

    rTokenMetrics.save();
  }

  return rTokenMetrics;
}

export function getOrCreateRTokenHourlySnapshot(
  rTokenAddress: string,
  event: ethereum.Event
): RTokenHourlySnapshot {
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  let hourId = hour.toString();
  let rTokenMetrics = RTokenHourlySnapshot.load(
    rTokenAddress.concat("-").concat(hourId)
  );

  if (!rTokenMetrics) {
    rTokenMetrics = new RTokenHourlySnapshot(
      rTokenAddress.concat("-").concat(hourId)
    );
    rTokenMetrics.protocol = PROTOCOL_SLUG;
    rTokenMetrics.rToken = rTokenAddress;
    rTokenMetrics.blockNumber = event.block.number;
    rTokenMetrics.timestamp = event.block.timestamp;

    rTokenMetrics.hourlyActiveUsers = INT_ZERO;
    rTokenMetrics.cumulativeUniqueUsers = INT_ZERO;
    rTokenMetrics.rsrStaked = BIGINT_ZERO;
    rTokenMetrics.rewardTokenSupply = BIGINT_ZERO;
    rTokenMetrics.hourlyRSRStaked = BIGINT_ZERO;
    rTokenMetrics.hourlyActiveUsers = INT_ZERO;
    rTokenMetrics.cumulativeRSRStaked = BIGINT_ZERO;
    rTokenMetrics.hourlyRSRUnstaked = BIGINT_ZERO;
    rTokenMetrics.cumulativeRSRUnstaked = BIGINT_ZERO;
    rTokenMetrics.rsrExchangeRate = BIGDECIMAL_ZERO;
    rTokenMetrics.basketRate = BIGDECIMAL_ZERO;
    rTokenMetrics.hourlyRTokenRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.hourlyRSRRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.cumulativeRSRRevenueUSD = BIGDECIMAL_ZERO;

    rTokenMetrics.save();
  }

  return rTokenMetrics;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.holderCount = BIGINT_ZERO;
    token.userCount = INT_ZERO;
    token.transferCount = BIGINT_ZERO;
    token.mintCount = BIGINT_ZERO;
    token.burnCount = BIGINT_ZERO;
    token.totalSupply = BIGINT_ZERO;
    token.totalBurned = BIGINT_ZERO;
    token.totalMinted = BIGINT_ZERO;
    token.cumulativeVolume = BIGINT_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.lastPriceUSD = BIGDECIMAL_ZERO;

    // Inherit RSVmetrics
    if (tokenAddress.equals(RSV_ADDRESS)) {
      token.transferCount = BigInt.fromString("5961");
      token.holderCount = BigInt.fromString("324");
      token.totalSupply = BigInt.fromString("6535046536411291513413162");

      token.userCount = 1260;
      token.mintCount = BigInt.fromString("131");
      token.burnCount = BigInt.fromString("82");
      token.totalBurned = BigInt.fromString("55838473117476189600000000");
      token.totalMinted = BigInt.fromString("62059326860904893261971700");
      token.lastPriceUSD = BigDecimal.fromString("1.085697");
      token.lastPriceBlockNumber = BigInt.fromString("16815303");
    }

    token.save();
  }
  return token;
}

export function getOrCreateRewardToken(tokenAddress: Address): RewardToken {
  let id = RewardTokenType.DEPOSIT.concat("-").concat(
    tokenAddress.toHexString()
  );
  let rewardToken = RewardToken.load(id);

  if (!rewardToken) {
    rewardToken = new RewardToken(id);
    let token = getOrCreateToken(tokenAddress);
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;

    rewardToken.save();
  }

  return rewardToken;
}

export function getOrCreateTokenDailySnapshot(
  tokenAddress: string,
  event: ethereum.Event
): TokenDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let tokenMetrics = TokenDailySnapshot.load(
    tokenAddress.concat("-").concat(dayId)
  );

  if (!tokenMetrics) {
    tokenMetrics = new TokenDailySnapshot(
      tokenAddress.concat("-").concat(dayId)
    );
    tokenMetrics.token = tokenAddress;
    tokenMetrics.dailyTotalSupply = BIGINT_ZERO;
    tokenMetrics.dailyHolderCount = INT_ZERO;
    tokenMetrics.dailyActiveUsers = INT_ZERO;
    tokenMetrics.cumulativeUniqueUsers = INT_ZERO;
    tokenMetrics.dailyEventCount = INT_ZERO;
    tokenMetrics.dailyMintCount = INT_ZERO;
    tokenMetrics.dailyMintAmount = BIGINT_ZERO;
    tokenMetrics.dailyBurnCount = INT_ZERO;
    tokenMetrics.dailyBurnAmount = BIGINT_ZERO;
    tokenMetrics.dailyVolume = BIGINT_ZERO;
    tokenMetrics.priceUSD = BIGDECIMAL_ZERO;
    tokenMetrics.blockNumber = event.block.number;
    tokenMetrics.timestamp = event.block.timestamp;

    tokenMetrics.save();
  }

  return tokenMetrics;
}

export function getOrCreateTokenHourlySnapshot(
  tokenAddress: string,
  event: ethereum.Event
): TokenHourlySnapshot {
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  let hourId = hour.toString();
  let tokenMetrics = TokenHourlySnapshot.load(
    tokenAddress.concat("-").concat(hourId)
  );

  if (!tokenMetrics) {
    tokenMetrics = new TokenHourlySnapshot(
      tokenAddress.concat("-").concat(hourId)
    );
    tokenMetrics.token = tokenAddress;
    tokenMetrics.hourlyTotalSupply = BIGINT_ZERO;
    tokenMetrics.hourlyHolderCount = INT_ZERO;
    tokenMetrics.hourlyActiveUsers = INT_ZERO;
    tokenMetrics.cumulativeUniqueUsers = INT_ZERO;
    tokenMetrics.hourlyEventCount = INT_ZERO;
    tokenMetrics.hourlyMintCount = INT_ZERO;
    tokenMetrics.hourlyMintAmount = BIGINT_ZERO;
    tokenMetrics.hourlyBurnCount = INT_ZERO;
    tokenMetrics.hourlyBurnAmount = BIGINT_ZERO;
    tokenMetrics.priceUSD = BIGDECIMAL_ZERO;
    tokenMetrics.hourlyVolume = BIGINT_ZERO;
    tokenMetrics.blockNumber = event.block.number;
    tokenMetrics.timestamp = event.block.timestamp;

    tokenMetrics.save();
  }

  return tokenMetrics;
}

export function getOrCreateRTokenAccount(
  accountAddress: Address,
  rTokenAddress: Address
): AccountRToken {
  let id = accountAddress
    .toHexString()
    .concat("-")
    .concat(rTokenAddress.toHexString());
  let accountRToken = AccountRToken.load(id);

  if (!accountRToken) {
    // Make sure the account record exists
    getOrCreateAccount(accountAddress, rTokenAddress);
    // Create account-token balance record
    let tokenBalance = getOrCreateAccountBalance(accountAddress, rTokenAddress);

    accountRToken = new AccountRToken(id);
    accountRToken.account = tokenBalance.account;
    accountRToken.rToken = tokenBalance.token;
    accountRToken.balance = tokenBalance.id;
    accountRToken.stake = BIGDECIMAL_ZERO;
    accountRToken.totalStaked = BIGINT_ZERO;
    accountRToken.totalUnstaked = BIGINT_ZERO;
    accountRToken.totalRSRStaked = BIGINT_ZERO;
    accountRToken.totalRSRUnstaked = BIGINT_ZERO;
    accountRToken.pendingUnstake = BIGINT_ZERO;
    accountRToken.blockNumber = BIGINT_ZERO;
    accountRToken.timestamp = BIGINT_ZERO;

    accountRToken.save();
  }

  return accountRToken;
}

export function getOrCreateStakeRecord(
  accountAddress: Address,
  rTokenAddress: Address,
  amount: BigInt,
  rsrAmount: BigInt,
  exchangeRate: BigInt,
  rsrPrice: BigDecimal,
  isStake: boolean,
  event: ethereum.Event
): AccountStakeRecord {
  let id = accountAddress
    .toHexString()
    .concat("-")
    .concat(rTokenAddress.toHexString())
    .concat("-")
    .concat(event.transaction.hash.toHexString());

  let record = AccountStakeRecord.load(id);

  if (!record) {
    record = new AccountStakeRecord(id);
    record.hash = event.transaction.hash.toHexString();
    record.account = accountAddress
      .toHexString()
      .concat("-")
      .concat(rTokenAddress.toHexString());
    record.amountRaw = amount;
    record.amount = bigIntToBigDecimal(amount);
    record.rsrAmount = bigIntToBigDecimal(rsrAmount);
    record.rsrAmountRaw = rsrAmount;
    record.exchangeRate = bigIntToBigDecimal(exchangeRate);
    record.exchangeRateRaw = exchangeRate;
    record.rsrPriceUSD = rsrPrice;
    record.isStake = isStake;
    record.blockNumber = event.block.number;
    record.timestamp = event.block.timestamp;
    record.save();
  }

  return record;
}

export function getOrCreateAccountRTokenDailySnapshot(
  accountAddress: Address,
  rTokenAddress: Address,
  event: ethereum.Event
): AccountRTokenDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let id = accountAddress
    .toHexString()
    .concat("-")
    .concat(rTokenAddress.toHexString())
    .concat("-")
    .concat(dayId);
  let accountMetric = AccountRTokenDailySnapshot.load(id);

  if (!accountMetric) {
    let balanceSnapshot = getOrCreateAccountBalanceDailySnapshot(
      accountAddress,
      rTokenAddress,
      event
    );

    accountMetric = new AccountRTokenDailySnapshot(id);
    accountMetric.account = accountAddress.toHexString();
    accountMetric.rToken = rTokenAddress.toHexString();
    accountMetric.balance = balanceSnapshot.id;
    accountMetric.stake = BIGDECIMAL_ZERO;
    accountMetric.totalStaked = BIGINT_ZERO;
    accountMetric.totalRSRStaked = BIGINT_ZERO;
    accountMetric.totalUnstaked = BIGINT_ZERO;
    accountMetric.totalRSRUnstaked = BIGINT_ZERO;
    accountMetric.blockNumber = event.block.number;
    accountMetric.timestamp = event.block.timestamp;

    accountMetric.save();
  }

  return accountMetric;
}

export function getOrCreateAccount(
  accountAddress: Address,
  rTokenAddress: Address
): Account {
  let account = Account.load(accountAddress.toHexString());

  if (!account) {
    account = new Account(accountAddress.toHexString());
    account.save();
    updateRTokenUniqueUsers(rTokenAddress.toHexString());
  }

  return account;
}

export function getOrCreateAccountBalance(
  accountAddress: Address,
  tokenAddress: Address
): AccountBalance {
  let id = accountAddress
    .toHexString()
    .concat("-")
    .concat(tokenAddress.toHexString());
  let accountBalance = AccountBalance.load(id);

  if (!accountBalance) {
    accountBalance = new AccountBalance(id);
    accountBalance.account = accountAddress.toHexString();
    accountBalance.token = tokenAddress.toHexString();
    accountBalance.transferCount = INT_ZERO;
    accountBalance.amount = BIGDECIMAL_ZERO;
    accountBalance.blockNumber = BIGINT_ZERO;
    accountBalance.timestamp = BIGINT_ZERO;

    accountBalance.save();
  }

  return accountBalance;
}

export function getOrCreateAccountBalanceDailySnapshot(
  accountAddress: Address,
  tokenAddress: Address,
  event: ethereum.Event
): AccountBalanceDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let id = accountAddress
    .toHexString()
    .concat("-")
    .concat(tokenAddress.toHexString())
    .concat("-")
    .concat(dayId);
  let accountMetric = AccountBalanceDailySnapshot.load(id);

  if (!accountMetric) {
    accountMetric = new AccountBalanceDailySnapshot(id);
    accountMetric.account = accountAddress.toHexString();
    accountMetric.token = tokenAddress.toHexString();
    accountMetric.transferCount = INT_ZERO;
    accountMetric.amount = BIGDECIMAL_ZERO;
    accountMetric.amountUSD = BIGDECIMAL_ZERO;
    accountMetric.blockNumber = event.block.number;
    accountMetric.timestamp = event.block.timestamp;

    accountMetric.save();
  }

  return accountMetric;
}

export function getOrCreateEntry(
  event: ethereum.Event,
  tokenId: string,
  accountId: string,
  amount: BigInt,
  type: string
): Entry {
  let id = tokenId
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.transactionLogIndex.toHexString())
    .concat("-")
    .concat(type);
  let entry = Entry.load(id);

  if (!entry) {
    entry = new Entry(id);
    entry.hash = event.transaction.hash.toHexString();
    entry.logIndex = event.transactionLogIndex.toI32();
    entry.token = tokenId;
    entry.nonce = event.transaction.nonce.toI32();
    entry.from = accountId;
    entry.blockNumber = event.block.number;
    entry.timestamp = event.block.timestamp;
    entry.amount = amount;
    // TODO: USD Amount
    entry.type = type;

    entry.save();
  }

  return entry;
}

export function getTokenAccount(
  accountAddress: Address,
  tokenAddress: Address
): Account {
  let account = Account.load(accountAddress.toHexString());

  if (!account) {
    account = new Account(accountAddress.toHexString());
    account.save();

    // Update token analytics
    let token = getOrCreateToken(tokenAddress);
    let rTokenId = token.rToken;
    token.userCount += INT_ONE;
    token.save();

    if (rTokenId) {
      updateRTokenUniqueUsers(rTokenId);
    }
  }

  return account;
}

export function getOrCreateTrade(event: TradeStarted): Trade {
  let trade = Trade.load(event.params.trade.toHexString());

  if (!trade) {
    trade = new Trade(event.params.trade.toHexString());

    let rTokenContract = RTokenContract.load(event.address.toHexString())!;
    let tradeContract = GnosisTrade.bind(event.params.trade);

    // Check if its a batch trade
    let auctionId = tradeContract.try_auctionId();

    if (auctionId.reverted) {
      let dutchTrade = DutchTrade.bind(event.params.trade);
      trade.worstCasePrice = bigIntToBigDecimal(dutchTrade.worstPrice());
      trade.endAt = dutchTrade.endTime();
      trade.endBlock = dutchTrade.endBlock();
      trade.startBlock = dutchTrade.startBlock();
      trade.kind = TradeKind.DUTCH_AUCTION;
    } else {
      trade.worstCasePrice = bigIntToBigDecimal(tradeContract.worstCasePrice());
      trade.endAt = tradeContract.endTime();
      trade.auctionId = auctionId.value;
      trade.kind = TradeKind.BATCH_AUCTION;
    }

    let buyTokenDecimals = fetchTokenDecimals(event.params.buy);
    let sellTokenDecimals = fetchTokenDecimals(event.params.sell);

    trade.amount = bigIntToBigDecimal(
      event.params.sellAmount,
      sellTokenDecimals
    );

    trade.minBuyAmount = bigIntToBigDecimal(
      event.params.minBuyAmount,
      buyTokenDecimals
    );

    trade.isSettled = false;
    trade.sellingTokenSymbol = fetchTokenSymbol(event.params.sell);
    trade.buyingTokenSymbol = fetchTokenSymbol(event.params.buy);
    trade.selling = event.params.sell.toHexString();
    trade.buying = event.params.buy.toHexString();
    trade.startedAt = event.block.timestamp;
    trade.rToken = rTokenContract.rToken;

    trade.save();
  }

  return trade;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}
