import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ActiveAccount, Protocol, RToken, Token } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  EntryType,
  INT_ONE,
  RSR_ADDRESS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";
import {
  getOrCreateAccountBalance,
  getOrCreateAccountBalanceDailySnapshot,
  getOrCreateAccountRTokenDailySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateProtocol,
  getOrCreateRTokenAccount,
  getOrCreateRTokenDailySnapshot,
  getOrCreateRTokenHourlySnapshot,
  getOrCreateToken,
  getOrCreateTokenDailySnapshot,
  getOrCreateTokenHourlySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import { getRSRPrice, getRTokenPrice } from "./tokens";
import { bigIntToBigDecimal, getUsdValue } from "./utils/numbers";

export function updateRTokenUniqueUsers(rTokenId: string): void {
  let protocol = getOrCreateProtocol();
  let rToken = RToken.load(rTokenId)!;

  rToken.cumulativeUniqueUsers += INT_ONE;
  rToken.save();

  protocol.cumulativeUniqueUsers += INT_ONE;
  protocol.save();
}

export function updateAccountBalance(
  accountAddress: Address,
  tokenAddress: Address,
  amount: BigInt,
  event: ethereum.Event
): void {
  let accountBalance = getOrCreateAccountBalance(accountAddress, tokenAddress);
  let balance = accountBalance.amount.plus(bigIntToBigDecimal(amount));

  if (accountBalance.amount.equals(BIGDECIMAL_ZERO) && amount.gt(BIGINT_ZERO)) {
    updateTokenHolder(tokenAddress, true, event);
  } else if (balance.le(BIGDECIMAL_ZERO)) {
    updateTokenHolder(tokenAddress, false, event);
  }

  accountBalance.amount = balance;
  accountBalance.transferCount += INT_ONE;
  accountBalance.blockNumber = event.block.number;
  accountBalance.timestamp = event.block.timestamp;
  accountBalance.save();

  // Update snapshot
  let accountBalanceSnapshot = getOrCreateAccountBalanceDailySnapshot(
    accountAddress,
    tokenAddress,
    event
  );
  accountBalanceSnapshot.amount = accountBalance.amount;
  accountBalanceSnapshot.transferCount = accountBalance.transferCount;
  accountBalanceSnapshot.blockNumber = accountBalance.blockNumber;
  accountBalanceSnapshot.timestamp = accountBalance.timestamp;
  accountBalanceSnapshot.save();
}

export function updateRTokenAccountBalance(
  accountAddress: Address,
  rTokenAddress: Address,
  amount: BigInt, // RewardToken amount
  rsrAmount: BigInt,
  event: ethereum.Event
): void {
  let accountBalance = getOrCreateRTokenAccount(accountAddress, rTokenAddress);

  // Stake
  if (amount.gt(BIGINT_ZERO)) {
    accountBalance.totalStaked = accountBalance.totalStaked.plus(amount);
    accountBalance.totalRSRStaked = accountBalance.totalRSRStaked.plus(
      rsrAmount
    );
    accountBalance.stake = accountBalance.stake.plus(
      bigIntToBigDecimal(amount)
    );
  } else {
    accountBalance.totalUnstaked = accountBalance.totalUnstaked.plus(
      amount.abs()
    );
    accountBalance.totalRSRUnstaked = accountBalance.totalRSRUnstaked.plus(
      rsrAmount
    );
    accountBalance.stake = accountBalance.stake.minus(
      bigIntToBigDecimal(amount.abs())
    );
  }

  accountBalance.blockNumber = event.block.number;
  accountBalance.timestamp = event.block.timestamp;
  accountBalance.save();

  // Update snapshot
  let accountBalanceSnapshot = getOrCreateAccountRTokenDailySnapshot(
    accountAddress,
    rTokenAddress,
    event
  );
  accountBalanceSnapshot.stake = accountBalance.stake;
  accountBalanceSnapshot.totalStaked = accountBalance.totalStaked;
  accountBalanceSnapshot.totalRSRStaked = accountBalance.totalRSRStaked;
  accountBalanceSnapshot.totalUnstaked = accountBalance.totalUnstaked;
  accountBalanceSnapshot.totalRSRUnstaked = accountBalance.totalRSRUnstaked;

  accountBalanceSnapshot.blockNumber = event.block.number;
  accountBalanceSnapshot.timestamp = event.block.timestamp;
  accountBalanceSnapshot.save();
}

// Get Token entity and refresh USD price
export function getTokenWithRefreshedPrice(
  address: Address,
  currentTimestamp: BigInt
): Token {
  let token = getOrCreateToken(address);

  if (
    token.lastPriceTimestamp.plus(BigInt.fromI32(3600)).lt(currentTimestamp)
  ) {
    let priceQuote = BIGDECIMAL_ZERO;

    if (address.equals(RSR_ADDRESS)) {
      priceQuote = getRSRPrice();
    } else {
      priceQuote = getRTokenPrice(address);
    }

    if (!priceQuote.equals(BIGDECIMAL_ZERO)) {
      token.lastPriceUSD = priceQuote;
      token.lastPriceTimestamp = currentTimestamp;
      token.save();
    }
  }

  return token;
}

export function updateProtocolRTokenMetrics(
  event: ethereum.Event,
  rTokenId: string,
  amount: BigInt,
  amountUSD: BigDecimal,
  oldMarketCap: BigDecimal,
  newMarketCap: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  const rToken = RToken.load(rTokenId)!;

  // Always track accurate marketcap in usd terms
  protocol.totalRTokenUSD = protocol.totalRTokenUSD
    .minus(oldMarketCap)
    .plus(newMarketCap);
  // Protocol cumulative data
  protocol.totalValueLockedUSD = protocol.totalRTokenUSD.plus(
    protocol.rsrStakedUSD
  );

  // Protocol cumulative data
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  protocol.transactionCount = protocol.transactionCount.plus(BIGINT_ONE);
  protocol.save();

  // Update snapshots
  updateUsageAndFinancialMetrics(
    event,
    rToken,
    protocol,
    amount,
    amountUSD,
    ""
  );
}

export function updateRTokenMetrics(
  event: ethereum.Event,
  rTokenAddress: Address,
  amount: BigInt,
  entryType: string
): void {
  let protocol = getOrCreateProtocol();
  let rToken = RToken.load(rTokenAddress.toHexString())!;
  let rsr = getTokenWithRefreshedPrice(RSR_ADDRESS, event.block.timestamp);
  let amountUSD = getUsdValue(amount, rsr.lastPriceUSD);

  if (entryType === EntryType.STAKE) {
    protocol.totalRsrStaked = protocol.totalRsrStaked.plus(amount);
    protocol.totalRsrStakedUSD = getUsdValue(
      protocol.totalRsrStaked,
      rsr.lastPriceUSD
    );

    // rToken
    rToken.totalRsrStaked = rToken.totalRsrStaked.plus(amount);
  } else if (entryType === EntryType.UNSTAKE) {
    protocol.totalRsrUnstaked = protocol.totalRsrUnstaked.plus(amount);
    protocol.totalRsrUnstakedUSD = getUsdValue(
      protocol.totalRsrUnstaked,
      rsr.lastPriceUSD
    );

    // rToken
    rToken.totalRsrUnstaked = rToken.totalRsrUnstaked.plus(amount);
  }

  // Save rToken data
  rToken.save();

  // Protocol cumulative data
  protocol.totalValueLockedUSD = protocol.totalRTokenUSD.plus(
    protocol.rsrStakedUSD
  );
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  protocol.transactionCount = protocol.transactionCount.plus(BIGINT_ONE);
  protocol.save();

  // Update snapshots
  updateUsageAndFinancialMetrics(
    event,
    rToken,
    protocol,
    amount,
    amountUSD,
    entryType
  );
}

// Update token metrics and snapshots
export function updateTokenMetrics(
  event: ethereum.Event,
  tokenAddress: Address,
  fromAddress: Address,
  amount: BigInt,
  entryType: string
): void {
  let token = getTokenWithRefreshedPrice(tokenAddress, event.block.timestamp);

  const marketCapUsdSnapshot = token.lastMarketCapUSD;

  // Token snapshots
  let tokenDaily = getOrCreateTokenDailySnapshot(token.id, event);
  let tokenHourly = getOrCreateTokenHourlySnapshot(token.id, event);

  // User data
  // Combine the id and the user address to generate a unique user id for the day
  let from = fromAddress
    .toHexString()
    .concat("-")
    .concat(token.id);
  let dailyActiveAccountId = from.concat("-").concat(getDayId(event));
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);

  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();

    tokenDaily.dailyActiveUsers += INT_ONE;
  }

  let hourlyActiveAccountId = from.concat("-").concat(getHourId(event));
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);

  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();

    tokenHourly.hourlyActiveUsers += INT_ONE;
  }

  let newSupply = token.totalSupply;

  // Update token supply and counts
  if (entryType === EntryType.MINT) {
    token.mintCount = token.mintCount.plus(BIGINT_ONE);
    token.totalMinted = token.totalMinted.plus(amount);
    newSupply = newSupply.plus(amount);
    if (newSupply.equals(BIGINT_ZERO)) {
      token.basketRate = BIGDECIMAL_ZERO;
    } else {
      token.basketRate = token.basketRate
        .times(token.totalSupply.toBigDecimal())
        .div(newSupply.toBigDecimal());
    }
    // Daily
    tokenDaily.dailyMintCount += INT_ONE;
    tokenDaily.dailyMintAmount = tokenDaily.dailyMintAmount.plus(amount);
    tokenDaily.basketRate = token.basketRate;
    // Hourly
    tokenHourly.hourlyMintCount += INT_ONE;
    tokenHourly.hourlyMintAmount = tokenHourly.hourlyMintAmount.plus(amount);
    tokenHourly.basketRate = token.basketRate;
  } else if (entryType === EntryType.BURN || entryType === EntryType.REDEEM) {
    token.burnCount = token.burnCount.plus(BIGINT_ONE);
    token.totalBurned = token.totalBurned.plus(amount);
    newSupply = newSupply.minus(amount);
    if (newSupply.equals(BIGINT_ZERO)) {
      token.basketRate = BIGDECIMAL_ZERO;
    } else {
      token.basketRate = token.basketRate
        .times(token.totalSupply.toBigDecimal())
        .div(newSupply.toBigDecimal());
    }
    // Daily
    tokenDaily.dailyBurnCount += INT_ONE;
    tokenDaily.dailyBurnAmount = tokenDaily.dailyBurnAmount.plus(amount);
    tokenDaily.basketRate = token.basketRate;
    // Hourly
    tokenHourly.hourlyBurnCount += INT_ONE;
    tokenHourly.hourlyBurnAmount = tokenHourly.hourlyBurnAmount.plus(amount);
    tokenHourly.basketRate = token.basketRate;
  }

  token.totalSupply = newSupply;
  token.cumulativeVolume = token.cumulativeVolume.plus(amount);
  token.lastMarketCapUSD = getUsdValue(token.totalSupply, token.lastPriceUSD);
  token.transferCount = token.transferCount.plus(BIGINT_ONE);
  token.save();

  tokenHourly.hourlyTotalSupply = token.totalSupply;
  tokenHourly.hourlyVolume = tokenHourly.hourlyVolume.plus(amount);
  tokenHourly.cumulativeUniqueUsers = token.userCount;
  tokenHourly.hourlyEventCount += INT_ONE;
  tokenHourly.priceUSD = token.lastPriceUSD;
  tokenHourly.basketRate = token.basketRate;
  tokenHourly.blockNumber = event.block.number;
  tokenHourly.timestamp = event.block.timestamp;
  tokenHourly.save();

  tokenDaily.dailyTotalSupply = token.totalSupply;
  tokenDaily.dailyVolume = tokenDaily.dailyVolume.plus(amount);
  tokenDaily.cumulativeUniqueUsers = token.userCount;
  tokenDaily.dailyEventCount += INT_ONE;
  tokenDaily.priceUSD = token.lastPriceUSD;
  tokenDaily.basketRate = token.basketRate;
  tokenDaily.blockNumber = event.block.number;
  tokenDaily.timestamp = event.block.timestamp;
  tokenDaily.save();

  let rTokenId = token.rToken;
  if (rTokenId) {
    // create AccountRToken relationship
    getOrCreateRTokenAccount(fromAddress, tokenAddress);
    updateProtocolRTokenMetrics(
      event,
      rTokenId,
      amount,
      getUsdValue(amount, token.lastPriceUSD),
      marketCapUsdSnapshot,
      token.lastMarketCapUSD
    );
  }
}

export function updateRTokenRevenueDistributed(
  rToken: RToken,
  amount: BigInt,
  holdersShare: BigDecimal,
  event: ethereum.Event
): void {
  let protocol = getOrCreateProtocol();
  let token = getTokenWithRefreshedPrice(
    Address.fromString(rToken.id),
    event.block.timestamp
  );

  rToken.cumulativeRTokenRevenue = rToken.cumulativeRTokenRevenue.plus(
    holdersShare
  );
  rToken.totalDistributedRTokenRevenue = rToken.totalDistributedRTokenRevenue.plus(
    amount
  );
  rToken.save();

  // Protocol metrics
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    bigIntToBigDecimal(amount).times(token.lastPriceUSD)
  );
  protocol.cumulativeRTokenRevenueUSD = protocol.cumulativeRTokenRevenueUSD.plus(
    holdersShare.times(token.lastPriceUSD)
  );
  protocol.save();
}

export function updateRSRRevenueDistributed(
  rToken: RToken,
  amount: BigInt,
  stakersShare: BigDecimal,
  event: ethereum.Event
): void {
  let rsr = getTokenWithRefreshedPrice(RSR_ADDRESS, event.block.number);
  let protocol = getOrCreateProtocol();

  rToken.cumulativeStakerRevenue = rToken.cumulativeStakerRevenue.plus(
    stakersShare
  );
  rToken.totalDistributedRSRRevenue = rToken.totalDistributedRSRRevenue.plus(
    amount
  );
  rToken.save();

  // Protocol metrics
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    bigIntToBigDecimal(amount).times(rsr.lastPriceUSD)
  );
  protocol.cumulativeRSRRevenueUSD = protocol.cumulativeRSRRevenueUSD.plus(
    stakersShare.times(rsr.lastPriceUSD)
  );
  protocol.rsrRevenue = protocol.rsrRevenue.plus(stakersShare);
  protocol.save();
}

function updateTokenHolder(
  tokenAddress: Address,
  newHolder: boolean,
  event: ethereum.Event
): void {
  let token = getOrCreateToken(tokenAddress);
  let dailyMetrics = getOrCreateTokenDailySnapshot(token.id, event);
  let hourlyMetrics = getOrCreateTokenHourlySnapshot(token.id, event);

  if (newHolder) {
    token.holderCount = token.holderCount.plus(BIGINT_ONE);
    dailyMetrics.dailyHolderCount += INT_ONE;
    hourlyMetrics.hourlyHolderCount += INT_ONE;
  } else {
    token.holderCount = token.holderCount.minus(BIGINT_ONE);
  }

  dailyMetrics.save();
  hourlyMetrics.save();
  token.save();
}

export function updateUsageAndFinancialMetrics(
  event: ethereum.Event,
  rToken: RToken,
  protocol: Protocol,
  amount: BigInt,
  usdPrice: BigDecimal,
  entryType: string
): void {
  // protocol metrics
  const financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);
  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  // rToken metrics
  const rTokenDaily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  const rTokenHourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  // TODO: Track issuances?
  if (entryType === EntryType.STAKE) {
    usageMetricsDaily.dailyRSRStaked = usageMetricsDaily.dailyRSRStaked.plus(
      amount
    );
    usageMetricsDaily.dailyRSRStakedUSD = getUsdValue(
      usageMetricsDaily.dailyRSRStaked,
      usdPrice
    );

    usageMetricsHourly.hourlyRSRStaked = usageMetricsHourly.hourlyRSRStaked.plus(
      amount
    );
    usageMetricsHourly.hourlyRSRStakedUSD = getUsdValue(
      usageMetricsHourly.hourlyRSRStaked,
      usdPrice
    );

    // rToken
    rTokenDaily.dailyRSRStaked = rTokenDaily.dailyRSRStaked.plus(amount);
    rTokenHourly.hourlyRSRStaked = rTokenHourly.hourlyRSRStaked.plus(amount);
  } else if (entryType === EntryType.UNSTAKE) {
    usageMetricsDaily.dailyRSRUnstaked = usageMetricsDaily.dailyRSRUnstaked.plus(
      amount
    );
    usageMetricsDaily.dailyRSRUnstakedUSD = getUsdValue(
      usageMetricsDaily.dailyRSRUnstaked,
      usdPrice
    );

    usageMetricsHourly.hourlyRSRUnstaked = usageMetricsHourly.hourlyRSRStaked.plus(
      amount
    );
    usageMetricsHourly.hourlyRSRStakedUSD = getUsdValue(
      usageMetricsHourly.hourlyRSRStaked,
      usdPrice
    );

    rTokenDaily.dailyRSRUnstaked = rTokenDaily.dailyRSRUnstaked.plus(amount);
    rTokenHourly.hourlyRSRUnstaked = rTokenHourly.hourlyRSRUnstaked.plus(
      amount
    );
  }

  financialMetricsDaily.blockNumber = event.block.number;
  financialMetricsDaily.timestamp = event.block.timestamp;

  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.dailyVolumeUSD = financialMetricsDaily.dailyVolumeUSD.plus(
    getUsdValue(amount, usdPrice)
  );
  financialMetricsDaily.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetricsDaily.rsrStaked = protocol.rsrStaked;
  financialMetricsDaily.rsrStakedUSD = protocol.rsrStakedUSD;
  financialMetricsDaily.rsrLocked = protocol.rsrLocked;
  financialMetricsDaily.rsrLockedUSD = protocol.rsrLockedUSD;

  financialMetricsDaily.cumulativeTotalRevenueUSD =
    protocol.cumulativeRTokenRevenueUSD;
  financialMetricsDaily.cumulativeRTokenRevenueUSD =
    protocol.cumulativeRTokenRevenueUSD;
  financialMetricsDaily.cumulativeRSRRevenueUSD =
    protocol.cumulativeRSRRevenueUSD;
  financialMetricsDaily.totalRTokenUSD = protocol.totalRTokenUSD;

  financialMetricsDaily.save();

  usageMetricsDaily.cumulativeRSRStaked = protocol.rsrStaked;
  usageMetricsDaily.cumulativeRSRStakedUSD = protocol.rsrStakedUSD;
  usageMetricsDaily.cumulativeRSRUnstaked = protocol.totalRsrUnstaked;
  usageMetricsDaily.cumulativeRSRUnstakedUSD = protocol.totalRsrUnstakedUSD;
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;
  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsDaily.save();

  // Usage metrics hourly cumulative data
  usageMetricsHourly.cumulativeRSRStaked = protocol.rsrStaked;
  usageMetricsHourly.cumulativeRSRStakedUSD = protocol.rsrStakedUSD;
  usageMetricsHourly.cumulativeRSRUnstaked = protocol.totalRsrUnstaked;
  usageMetricsHourly.cumulativeRSRUnstakedUSD = protocol.totalRsrUnstakedUSD;
  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.save();

  // rToken daily cumulative data
  rTokenDaily.rsrExchangeRate = rToken.rsrExchangeRate;
  rTokenDaily.rsrStaked = rToken.rsrStaked;
  rTokenDaily.cumulativeRSRStaked = rToken.totalRsrStaked;
  rTokenDaily.cumulativeRSRUnstaked = rToken.totalRsrUnstaked;
  rTokenDaily.blockNumber = event.block.number;
  rTokenDaily.timestamp = event.block.timestamp;
  rTokenDaily.rsrPrice = getRSRPrice();
  rTokenDaily.save();

  // rToken hourly cumulative data
  rTokenHourly.rsrExchangeRate = rToken.rsrExchangeRate;
  rTokenHourly.rsrStaked = rToken.rsrStaked;
  rTokenHourly.cumulativeRSRStaked = rToken.totalRsrStaked;
  rTokenHourly.cumulativeRSRUnstaked = rToken.totalRsrUnstaked;
  rTokenHourly.blockNumber = event.block.number;
  rTokenHourly.timestamp = event.block.timestamp;
  rTokenHourly.save();
}

function getDayId(event: ethereum.Event): string {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  return day.toString();
}

function getHourId(event: ethereum.Event): string {
  // Number of days since Unix epoch
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  return hour.toString();
}
