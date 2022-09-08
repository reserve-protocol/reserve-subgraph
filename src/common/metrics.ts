import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { ActiveAccount, RToken, Token } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  EntryType,
  INT_ONE,
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
import { getRSRPrice, getRTokenPrice, getTokenPrice } from "./tokens";
import { bigIntToBigDecimal, getUsdValue } from "./utils/numbers";

export function updateFinancials(
  event: ethereum.Event,
  amountUSD: BigDecimal
): void {
  let financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);
  let protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetricsDaily.blockNumber = event.block.number;
  financialMetricsDaily.timestamp = event.block.timestamp;

  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.dailyVolumeUSD = financialMetricsDaily.dailyVolumeUSD.plus(
    amountUSD
  );
  financialMetricsDaily.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetricsDaily.insurance = protocol.insurance;
  financialMetricsDaily.insuranceUSD = protocol.insuranceUSD;

  financialMetricsDaily.cumulativeTotalRevenueUSD =
    protocol.cumulativeRTokenRevenueUSD;
  financialMetricsDaily.cumulativeRTokenRevenueUSD =
    protocol.cumulativeRTokenRevenueUSD;
  financialMetricsDaily.cumulativeInsuranceRevenueUSD =
    protocol.cumulativeInsuranceRevenueUSD;
  financialMetricsDaily.totalRTokenUSD = protocol.totalRTokenUSD;

  financialMetricsDaily.save();
}

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
  event: ethereum.Event
): void {
  let accountBalance = getOrCreateRTokenAccount(accountAddress, rTokenAddress);
  let stakeAmount = accountBalance.stake.plus(bigIntToBigDecimal(amount));

  accountBalance.stake = stakeAmount;
  accountBalance.blockNumber = event.block.number;
  accountBalance.timestamp = event.block.timestamp;
  accountBalance.save();

  // Update snapshot
  let accountBalanceSnapshot = getOrCreateAccountRTokenDailySnapshot(
    accountAddress,
    rTokenAddress,
    event
  );
  accountBalanceSnapshot.stake = stakeAmount;
  accountBalanceSnapshot.blockNumber = event.block.number;
  accountBalanceSnapshot.timestamp = event.block.timestamp;
  accountBalanceSnapshot.save();
}

export function updateRTokenMetrics(
  event: ethereum.Event,
  rTokenAddress: Address,
  amount: BigInt,
  entryType: string
): void {
  let protocol = getOrCreateProtocol();
  let rToken = RToken.load(rTokenAddress.toHexString())!;
  let token = Token.load(rToken.token)!;
  let rsrPrice = rToken.rsrPriceUSD;

  if (rToken.rsrPriceLastBlock.lt(event.block.number)) {
    rsrPrice = getRSRPrice();
    rToken.rsrPriceLastBlock = event.block.number;
  }

  let amountUSD = BIGDECIMAL_ZERO;

  if (
    entryType === EntryType.MINT ||
    entryType === EntryType.BURN ||
    entryType === EntryType.TRANSFER ||
    entryType === EntryType.CANCEL_ISSUANCE ||
    entryType === EntryType.CLAIM
  ) {
    amountUSD = getUsdValue(amount, token.lastPriceUSD);
  } else {
    amountUSD = getUsdValue(amount, rsrPrice);
  }

  // protocol metrics
  let usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  let usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  // rToken metrics
  let rTokenDaily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  let rTokenHourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  // TODO: Total value lock
  // TODO: Revenue
  if (entryType === EntryType.MINT) {
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
    protocol.totalRTokenUSD = protocol.totalRTokenUSD.plus(amountUSD);
  } else if (entryType === EntryType.BURN) {
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
      amountUSD
    );
    protocol.totalRTokenUSD = protocol.totalRTokenUSD.minus(amountUSD);
  } else if (entryType === EntryType.STAKE) {
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
    protocol.insurance = protocol.insurance.plus(amount);
    protocol.insuranceUSD = getUsdValue(protocol.insurance, rsrPrice);
    protocol.rsrStaked = protocol.rsrStaked.plus(amount);
    protocol.rsrStakedUSD = getUsdValue(protocol.rsrStaked, rsrPrice);

    usageMetricsDaily.dailyRSRStaked = usageMetricsDaily.dailyRSRStaked.plus(
      amount
    );
    usageMetricsDaily.dailyRSRStakedUSD = getUsdValue(
      usageMetricsDaily.dailyRSRStaked,
      rsrPrice
    );

    usageMetricsHourly.hourlyRSRStaked = usageMetricsHourly.hourlyRSRStaked.plus(
      amount
    );
    usageMetricsHourly.hourlyRSRStakedUSD = getUsdValue(
      usageMetricsHourly.hourlyRSRStaked,
      rsrPrice
    );

    // rToken
    rToken.insurance = rToken.insurance.plus(amount);
    rToken.rsrStaked = rToken.rsrStaked.plus(amount);

    rTokenDaily.dailyRSRStaked = rTokenDaily.dailyRSRStaked.plus(amount);
    rTokenHourly.hourlyRSRStaked = rTokenHourly.hourlyRSRStaked.plus(amount);
  } else if (entryType === EntryType.UNSTAKE) {
    protocol.rsrUnstaked = protocol.rsrUnstaked.plus(amount);
    protocol.rsrUnstakedUSD = getUsdValue(protocol.rsrUnstaked, rsrPrice);

    usageMetricsDaily.dailyRSRUnstaked = usageMetricsDaily.dailyRSRUnstaked.plus(
      amount
    );
    usageMetricsDaily.dailyRSRUnstakedUSD = getUsdValue(
      usageMetricsDaily.dailyRSRUnstaked,
      rsrPrice
    );

    usageMetricsHourly.hourlyRSRUnstaked = usageMetricsHourly.hourlyRSRStaked.plus(
      amount
    );
    usageMetricsHourly.hourlyRSRStakedUSD = usageMetricsHourly.hourlyRSRUnstakedUSD.plus(
      amountUSD
    );

    // rToken
    rToken.rsrUnstaked = rToken.rsrUnstaked.plus(amount);

    rTokenDaily.dailyRSRUnstaked = rTokenDaily.dailyRSRUnstaked.plus(amount);
    rTokenHourly.hourlyRSRUnstaked = rTokenHourly.hourlyRSRUnstaked.plus(
      amount
    );
  } else if (entryType === EntryType.WITHDRAW) {
    rToken.insurance = rToken.insurance.minus(amount);

    protocol.insurance = protocol.insurance.minus(amount);
    protocol.insuranceUSD = getUsdValue(protocol.insurance, rsrPrice);
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
      amountUSD
    );
  }
  // Save rToken data
  rToken.save();

  // Protocol cumulative data
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  protocol.transactionCount = protocol.transactionCount.plus(BIGINT_ONE);
  protocol.save();

  // Usage metrics daily cumulative data
  usageMetricsDaily.cumulativeRSRStaked = protocol.rsrStaked;
  usageMetricsDaily.cumulativeRSRStakedUSD = protocol.rsrStakedUSD;
  usageMetricsDaily.cumulativeRSRUnstaked = protocol.rsrUnstaked;
  usageMetricsDaily.cumulativeRSRUnstakedUSD = protocol.rsrUnstakedUSD;
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;
  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsDaily.save();

  // Usage metrics hourly cumulative data
  usageMetricsHourly.cumulativeRSRStaked = protocol.rsrStaked;
  usageMetricsHourly.cumulativeRSRStakedUSD = protocol.rsrStakedUSD;
  usageMetricsHourly.cumulativeRSRUnstaked = protocol.rsrUnstaked;
  usageMetricsHourly.cumulativeRSRUnstakedUSD = protocol.rsrUnstakedUSD;
  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.save();

  // rToken daily cumulative data
  rTokenDaily.rsrExchangeRate = rToken.rsrExchangeRate;
  rTokenDaily.basketRate = rToken.basketRate;
  rTokenDaily.insurance = rToken.insurance;
  rTokenDaily.cumulativeRSRStaked = rToken.rsrStaked;
  rTokenDaily.cumulativeRSRUnstaked = rToken.rsrUnstaked;
  rTokenDaily.blockNumber = event.block.number;
  rTokenDaily.timestamp = event.block.timestamp;
  rTokenDaily.save();

  // rToken hourly cumulative data
  rTokenHourly.rsrExchangeRate = rToken.rsrExchangeRate;
  rTokenHourly.basketRate = rToken.basketRate;
  rTokenHourly.insurance = rToken.insurance;
  rTokenHourly.cumulativeRSRStaked = rToken.rsrStaked;
  rTokenHourly.cumulativeRSRUnstaked = rToken.rsrUnstaked;
  rTokenHourly.blockNumber = event.block.number;
  rTokenHourly.timestamp = event.block.timestamp;
  rTokenHourly.save();

  // Update protocol financial metrics snapshot
  updateFinancials(event, amountUSD);
}

// Update token metrics and snapshots
export function updateTokenMetrics(
  event: ethereum.Event,
  tokenAddress: Address,
  fromAddress: Address,
  amount: BigInt,
  entryType: string
): void {
  let token = getOrCreateToken(tokenAddress);
  // Token snapshots
  let tokenDaily = getOrCreateTokenDailySnapshot(token.id, event);
  let tokenHourly = getOrCreateTokenHourlySnapshot(token.id, event);

  // Update token price
  if (token.lastPriceBlockNumber.lt(event.block.number)) {
    token.lastPriceUSD = getRTokenPrice(tokenAddress);
    token.lastPriceBlockNumber = event.block.number;
  }

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

    log.warning("Daily active user plus one!!!", []);
    tokenDaily.dailyActiveUsers += INT_ONE;
  }

  let hourlyActiveAccountId = from.concat("-").concat(getHourId(event));
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);

  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();

    log.warning("Hourly active user plus one!!!", []);
    tokenHourly.hourlyActiveUsers += INT_ONE;
  }

  // Update token supply and counts
  if (entryType === EntryType.MINT) {
    token.mintCount = token.mintCount.plus(BIGINT_ONE);
    token.totalMinted = token.totalMinted.plus(amount);
    token.totalSupply = token.totalSupply.plus(amount);
    // Daily
    tokenDaily.dailyMintCount += INT_ONE;
    tokenDaily.dailyMintAmount = tokenDaily.dailyMintAmount.plus(amount);
    // Hourly
    tokenHourly.hourlyMintCount += INT_ONE;
    tokenHourly.hourlyMintAmount = tokenHourly.hourlyMintAmount.plus(amount);
  } else if (entryType === EntryType.BURN) {
    token.burnCount = token.burnCount.plus(BIGINT_ONE);
    token.totalBurned = token.totalBurned.plus(amount);
    // Daily
    tokenDaily.dailyBurnCount += INT_ONE;
    tokenDaily.dailyBurnAmount = tokenDaily.dailyBurnAmount.plus(amount);
    // Hourly
    tokenHourly.hourlyBurnCount += INT_ONE;
    tokenHourly.hourlyBurnAmount = tokenHourly.hourlyBurnAmount.plus(amount);
  }

  token.cumulativeVolume = token.cumulativeVolume.plus(amount);
  token.transferCount = token.transferCount.plus(BIGINT_ONE);
  token.save();

  tokenHourly.hourlyTotalSupply = token.totalSupply;
  tokenHourly.hourlyVolume = tokenHourly.hourlyVolume.plus(amount);
  tokenHourly.cumulativeUniqueUsers = token.userCount;
  tokenHourly.hourlyEventCount += INT_ONE;
  tokenHourly.priceUSD = token.lastPriceUSD;
  tokenHourly.blockNumber = event.block.number;
  tokenHourly.timestamp = event.block.timestamp;
  tokenHourly.save();

  tokenDaily.dailyTotalSupply = token.totalSupply;
  tokenDaily.dailyVolume = tokenDaily.dailyVolume.plus(amount);
  tokenDaily.cumulativeUniqueUsers = token.userCount;
  tokenDaily.dailyEventCount += INT_ONE;
  tokenDaily.priceUSD = token.lastPriceUSD;
  tokenDaily.blockNumber = event.block.number;
  tokenDaily.timestamp = event.block.timestamp;
  tokenDaily.save();

  let rTokenId = token.rToken;

  // For tokens that are not RSV
  if (rTokenId) {
    // create AccountRToken relationship
    getOrCreateRTokenAccount(fromAddress, tokenAddress);
    updateRTokenMetrics(event, Address.fromString(rTokenId), amount, entryType);
  }
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

function getDayId(event: ethereum.Event): string {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  return day.toString();
}

function getHourId(event: ethereum.Event): string {
  // Number of days since Unix epoch
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  return hour.toString();
}
