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

// Update FinancialsDailySnapshots entity
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
  token.save();
}

export function updateRTokenUniqueUsers(rTokenId: string): void {
  let protocol = getOrCreateProtocol();
  let rToken = RToken.load(rTokenId)!;

  rToken.cumulativeUniqueUsers += INT_ONE;
  protocol.cumulativeUniqueUsers += INT_ONE;

  protocol.save();
  rToken.save();
}

export function updateAccountBalance(
  accountAddress: Address,
  tokenAddress: Address,
  amount: BigInt,
  event: ethereum.Event
): void {
  // update balance
  let accountBalance = getOrCreateAccountBalance(accountAddress, tokenAddress);
  let accountBalanceSnapshot = getOrCreateAccountBalanceDailySnapshot(
    accountAddress,
    tokenAddress,
    event
  );
  let balance = accountBalance.amount.plus(bigIntToBigDecimal(amount));

  if (accountBalance.amount.le(BIGDECIMAL_ZERO) && amount.gt(BIGINT_ZERO)) {
    updateTokenHolder(tokenAddress, true, event);
  } else if (balance.le(BIGDECIMAL_ZERO)) {
    updateTokenHolder(tokenAddress, false, event);
  }

  accountBalance.amount = balance;
  accountBalance.transferCount += INT_ONE;
  accountBalance.blockNumber = event.block.number;
  accountBalance.timestamp = event.block.timestamp;
  accountBalance.save();

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
  let accountBalanceSnapshot = getOrCreateAccountRTokenDailySnapshot(
    accountAddress,
    rTokenAddress,
    event
  );
  let stakeAmount = accountBalance.stake.plus(bigIntToBigDecimal(amount));

  accountBalance.stake = stakeAmount;
  accountBalance.blockNumber = event.block.number;
  accountBalance.timestamp = event.block.timestamp;
  accountBalance.save();

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
    entryType === EntryType.TRANSFER
  ) {
    amountUSD = bigIntToBigDecimal(amount).times(token.lastPriceUSD);
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
    protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  } else if (entryType === EntryType.BURN) {
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
      amountUSD
    );
    protocol.totalRTokenUSD = protocol.totalRTokenUSD.minus(amountUSD);
    protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  } else if (entryType === EntryType.TRANSFER) {
    protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  } else if (entryType === EntryType.STAKE) {
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD);
    protocol.insurance = protocol.insurance.plus(amount);
    protocol.rsrStakedUSD = getUsdValue(protocol.insurance, rsrPrice);
    protocol.rsrStaked = protocol.rsrStaked.plus(amount);
    protocol.rsrStakedUSD = getUsdValue(protocol.rsrStaked, rsrPrice);

    usageMetricsDaily.dailyRSRStaked = usageMetricsDaily.dailyRSRStaked.plus(
      amount
    );
    usageMetricsDaily.dailyRSRStakedUSD = getUsdValue(
      usageMetricsDaily.dailyRSRStaked,
      rsrPrice
    );
    usageMetricsDaily.cumulativeRSRStaked = protocol.rsrStaked;
    usageMetricsDaily.cumulativeRSRStakedUSD = protocol.rsrStakedUSD;

    usageMetricsHourly.hourlyRSRStaked = usageMetricsHourly.hourlyRSRStaked.plus(
      amount
    );
    usageMetricsHourly.hourlyRSRStakedUSD = getUsdValue(
      usageMetricsHourly.hourlyRSRStaked,
      rsrPrice
    );
    usageMetricsHourly.cumulativeRSRStaked = protocol.rsrStaked;
    usageMetricsHourly.cumulativeRSRStakedUSD = protocol.rsrStakedUSD;

    // rToken
    rToken.insurance = rToken.insurance.plus(amount);
    rTokenDaily.insurance = rToken.insurance;
    rTokenHourly.insurance = rToken.insurance;
  } else if (entryType === EntryType.UNSTAKE) {
    protocol.rsrUnstaked = protocol.rsrUnstaked.plus(amount);
    protocol.rsrUnstakedUSD = getUsdValue(protocol.rsrUnstaked, rsrPrice);

    usageMetricsDaily.dailyRSRUnstaked = usageMetricsDaily.dailyRSRStaked.plus(
      amount
    );
    usageMetricsDaily.dailyRSRStakedUSD = usageMetricsDaily.dailyRSRUnstakedUSD.plus(
      amountUSD
    );
    usageMetricsDaily.cumulativeRSRUnstaked = protocol.rsrStaked;
    usageMetricsDaily.cumulativeRSRStakedUSD = protocol.rsrStakedUSD;

    usageMetricsHourly.hourlyRSRUnstaked = usageMetricsHourly.hourlyRSRStaked.plus(
      amount
    );
    usageMetricsHourly.hourlyRSRStakedUSD = usageMetricsHourly.hourlyRSRUnstakedUSD.plus(
      amountUSD
    );
    usageMetricsHourly.cumulativeRSRUnstaked = protocol.rsrStaked;
    usageMetricsHourly.cumulativeRSRStakedUSD = protocol.rsrStakedUSD;
    // rToken
    rToken.rsrUnstaked = rToken.rsrUnstaked.plus(amount);

    rTokenDaily.dailyRSRUnstaked = rTokenDaily.dailyRSRUnstaked.plus(amount);
    rTokenDaily.cumulativeRSRUnstaked = rToken.rsrUnstaked;
  } else if (entryType === EntryType.WITHDRAW) {
    protocol.insurance = protocol.insurance.minus(amount);
    protocol.insuranceUSD = getUsdValue(protocol.insurance, rsrPrice);
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
      amountUSD
    );
    // rToken
    rToken.insurance = rToken.insurance.minus(amount);
    rTokenDaily.insurance = rToken.insurance;
    rTokenHourly.insurance = rToken.insurance;
  }

  protocol.transactionCount = protocol.transactionCount.plus(BIGINT_ONE);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  rTokenDaily.blockNumber = event.block.number;
  rTokenDaily.timestamp = event.block.timestamp;

  rTokenHourly.blockNumber = event.block.number;
  rTokenHourly.timestamp = event.block.timestamp;

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  rToken.save();
  protocol.save();
  usageMetricsDaily.save();
  usageMetricsHourly.save();

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
  let tokenPrice = token.lastPriceUSD;
  let rTokenAddress = token.rToken;
  if (!rTokenAddress) {
    rTokenAddress = "NO ADDRESS";
  }
  // Update token price
  if (token.lastPriceBlockNumber.lt(event.block.number)) {
    tokenPrice = token.rToken
      ? getRTokenPrice(tokenAddress)
      : getTokenPrice(tokenAddress);
    token.lastPriceUSD = tokenPrice;
    token.lastPriceBlockNumber = event.block.number;
  }

  let from = fromAddress
    .toHexString()
    .concat("-")
    .concat(token.id);

  // Token snapshots
  let tokenDaily = getOrCreateTokenDailySnapshot(token.id, event);
  let tokenHourly = getOrCreateTokenHourlySnapshot(token.id, event);

  // User data
  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = from.concat("-").concat(getDayId(event));
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);

  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    tokenDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  let hourlyActiveAccountId = from.concat("-").concat(getHourId(event));
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);

  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    tokenHourly.hourlyActiveUsers += INT_ONE;
    hourlyActiveAccount.save();
  }

  // Update token supply and counts
  if (entryType === EntryType.MINT) {
    token.mintCount = token.mintCount.plus(BIGINT_ONE);
    token.totalMinted = token.totalMinted.plus(amount);
    token.totalSupply = token.totalSupply.plus(amount);
    token.transferCount = token.transferCount.plus(BIGINT_ONE);

    tokenDaily.dailyMintCount += INT_ONE;
    tokenDaily.dailyMintAmount = tokenDaily.dailyBurnAmount.plus(amount);
    tokenDaily.dailyTotalSupply = tokenDaily.dailyTotalSupply.plus(amount);

    tokenHourly.hourlyMintCount += INT_ONE;
    tokenHourly.hourlyMintAmount = tokenHourly.hourlyMintAmount.plus(amount);
    tokenHourly.hourlyTotalSupply = tokenHourly.hourlyTotalSupply.plus(amount);
  } else if (entryType === EntryType.BURN) {
    token.burnCount = token.burnCount.plus(BIGINT_ONE);
    token.totalBurned = token.totalBurned.plus(amount);
    token.totalSupply = token.totalSupply.minus(amount);
    token.transferCount = token.transferCount.plus(BIGINT_ONE);

    tokenDaily.dailyBurnCount += INT_ONE;
    tokenDaily.dailyBurnAmount = tokenDaily.dailyBurnAmount.plus(amount);
    tokenDaily.dailyTotalSupply = tokenDaily.dailyTotalSupply.minus(amount);

    tokenHourly.hourlyBurnCount += INT_ONE;
    tokenHourly.hourlyBurnAmount = tokenHourly.hourlyBurnAmount.plus(amount);
    tokenHourly.hourlyTotalSupply = tokenHourly.hourlyTotalSupply.plus(amount);
  }

  tokenHourly.hourlyVolume = tokenHourly.hourlyVolume.plus(amount);
  tokenHourly.cumulativeUniqueUsers = token.userCount;
  tokenHourly.hourlyEventCount += INT_ONE;
  tokenHourly.blockNumber = event.block.number;
  tokenHourly.timestamp = event.block.timestamp;
  tokenHourly.priceUSD = tokenPrice;
  tokenHourly.save();

  tokenDaily.dailyVolume = tokenDaily.dailyVolume.plus(amount);
  tokenDaily.cumulativeUniqueUsers = token.userCount;
  tokenDaily.dailyEventCount += INT_ONE;
  tokenDaily.blockNumber = event.block.number;
  tokenDaily.priceUSD = tokenPrice;
  tokenDaily.timestamp = event.block.timestamp;
  tokenDaily.save();

  token.cumulativeVolume = token.cumulativeVolume.plus(amount);
  token.transferCount = token.transferCount.plus(BIGINT_ONE);
  token.save();

  let rTokenId = token.rToken;

  // For tokens that are not RSV
  if (rTokenId) {
    // create AccountRToken relationship
    getOrCreateRTokenAccount(fromAddress, tokenAddress);
    updateRTokenMetrics(event, Address.fromString(rTokenId), amount, entryType);
  }
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
