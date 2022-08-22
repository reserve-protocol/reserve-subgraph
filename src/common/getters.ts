import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  AccountRToken,
  AccountRTokenDailySnapshot,
  FinancialsDailySnapshot,
  Protocol,
  RewardToken,
  RTokenDailySnapshot,
  RTokenHourlySnapshot,
  Token,
  TokenDailySnapshot,
  TokenHourlySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  FACTORY_ADDRESS,
  INT_ONE,
  INT_ZERO,
  Network,
  ProtocolType,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SLUG,
  PROTOCOL_SUBGRAPH_VERSION,
  RewardTokenType,
  RSV_ADDRESS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../common/constants";
import {
  AccountBalance,
  AccountBalanceDailySnapshot,
  Entry,
} from "./../../generated/schema";
import { updateRTokenUniqueUsers } from "./metrics";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./tokens";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new Protocol(FACTORY_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;

    protocol.insurance = BIGINT_ZERO;
    protocol.insuranceUSD = BIGDECIMAL_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeInsuranceRevenueUSD = BIGDECIMAL_ZERO;
    protocol.transactionCount = BIGINT_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.GENERIC;

    protocol.rsrStaked = BIGINT_ZERO;
    protocol.rsrStakedUSD = BIGDECIMAL_ZERO;
    protocol.rsrUnstaked = BIGINT_ZERO;
    protocol.rsrUnstakedUSD = BIGDECIMAL_ZERO;
    protocol.totalRTokenUSD = BIGDECIMAL_ZERO; // Maybe duplicated from cumulative volume
    protocol.rTokenCount = INT_ZERO;

    protocol.save();
  }
  return protocol;
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
    usageMetrics.protocol = FACTORY_ADDRESS;

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
    usageMetrics.protocol = FACTORY_ADDRESS;

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
    financialMetrics.protocol = FACTORY_ADDRESS;

    financialMetrics.insurance = BIGINT_ZERO;
    financialMetrics.insuranceUSD = BIGDECIMAL_ZERO;

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;

    financialMetrics.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeInsuranceRevenueUSD = BIGDECIMAL_ZERO;
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
    rTokenMetrics.protocol = FACTORY_ADDRESS;
    rTokenMetrics.rToken = rTokenAddress;
    rTokenMetrics.blockNumber = event.block.number;
    rTokenMetrics.timestamp = event.block.timestamp;

    rTokenMetrics.dailyActiveUsers = INT_ZERO;
    rTokenMetrics.cumulativeUniqueUsers = INT_ZERO;
    rTokenMetrics.insurance = BIGINT_ZERO;
    rTokenMetrics.rewardTokenSupply = BIGINT_ZERO;
    rTokenMetrics.rsrPriceUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.dailyRSRStaked = BIGINT_ZERO;
    rTokenMetrics.dailyActiveUsers = INT_ZERO;
    rTokenMetrics.cumulativeRSRStaked = BIGINT_ZERO;
    rTokenMetrics.dailyRSRUnstaked = BIGINT_ZERO;
    rTokenMetrics.cumulativeRSRUnstaked = BIGINT_ZERO;
    rTokenMetrics.rsrExchangeRate = BIGINT_ZERO;
    rTokenMetrics.basketRate = BIGINT_ZERO;
    rTokenMetrics.dailyRTokenRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.dailyInsuranceRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.cumulativeInsuranceRevenueUSD = BIGDECIMAL_ZERO;

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
    rTokenMetrics.protocol = FACTORY_ADDRESS;
    rTokenMetrics.rToken = rTokenAddress;
    rTokenMetrics.blockNumber = event.block.number;
    rTokenMetrics.timestamp = event.block.timestamp;

    rTokenMetrics.hourlyActiveUsers = INT_ZERO;
    rTokenMetrics.cumulativeUniqueUsers = INT_ZERO;
    rTokenMetrics.insurance = BIGINT_ZERO;
    rTokenMetrics.rewardTokenSupply = BIGINT_ZERO;
    rTokenMetrics.rsrPriceUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.hourlyRSRStaked = BIGINT_ZERO;
    rTokenMetrics.hourlyActiveUsers = INT_ZERO;
    rTokenMetrics.cumulativeRSRStaked = BIGINT_ZERO;
    rTokenMetrics.hourlyRSRUnstaked = BIGINT_ZERO;
    rTokenMetrics.cumulativeRSRUnstaked = BIGINT_ZERO;
    rTokenMetrics.rsrExchangeRate = BIGINT_ZERO;
    rTokenMetrics.basketRate = BIGINT_ZERO;
    rTokenMetrics.hourlyRTokenRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.cumulativeRTokenRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.hourlyInsuranceRevenueUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.cumulativeInsuranceRevenueUSD = BIGDECIMAL_ZERO;

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

    // Inherit RSV-v1 metrics
    if (tokenAddress === RSV_ADDRESS) {
      token.transferCount = BigInt.fromI32(1933);
      token.holderCount = BigInt.fromI32(220);
      token.totalSupply = BigInt.fromI32(314192);
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
    // Create account-token balance record
    let tokenBalance = getOrCreateAccountBalance(accountAddress, rTokenAddress);

    accountRToken = new AccountRToken(id);
    accountRToken.account = tokenBalance.account;
    accountRToken.rToken = tokenBalance.token;
    accountRToken.balance = tokenBalance.id;
    accountRToken.stake = BIGDECIMAL_ZERO;
    accountRToken.blockNumber = BIGINT_ZERO;
    accountRToken.timestamp = BIGINT_ZERO;

    accountRToken.save();
  }

  return accountRToken;
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
    accountMetric.blockNumber = event.block.number;
    accountMetric.timestamp = event.block.timestamp;

    accountMetric.save();
  }

  return accountMetric;
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
    .concat(event.transactionLogIndex.toHexString());
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

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}
