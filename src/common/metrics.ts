import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ActiveAccount, RToken } from "../../generated/schema";
import {
  BIGINT_ONE,
  EntryType,
  INT_ONE,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";
import {
  getOrCreateAccountBalance,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateProtocol,
  getOrCreateRTokenDailySnapshot,
  getOrCreateRTokenHourlySnapshot,
  getOrCreateToken,
  getOrCreateTokenDailySnapshot,
  getOrCreateTokenHourlySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);

  let protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetricsDaily.blockNumber = event.block.number;
  financialMetricsDaily.timestamp = event.block.timestamp;
  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

  financialMetricsDaily.insurance = protocol.insurance;
  financialMetricsDaily.cumulativeTotalRevenueUSD =
    protocol.cumulativeRTokenRevenueUSD;
  financialMetricsDaily.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  // TODO: Daily metrics
  financialMetricsDaily.save();
}

export function updateInsuranceMetrics(
  event: ethereum.Event,
  rTokenAddress: Address,
  accountAddress: Address
): void {
  const protocol = getOrCreateProtocol();
  const rToken = RToken.load(rTokenAddress.toHexString())!;

  // let protocol = getOrCreateProtocol();

  // let usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  // let usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  // let rTokenDaily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  // let rTokenHourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  // if (entryType === EntryType.STAKE) {
  // } else if (entryType === EntryType.UNSTAKE) {
  // }

  // // Update the block number and timestamp to that of the last transaction of that day
  // usageMetricsDaily.blockNumber = event.block.number;
  // usageMetricsDaily.timestamp = event.block.timestamp;
  // usageMetricsDaily.dailyTransactionCount += INT_ONE;

  // usageMetricsHourly.blockNumber = event.block.number;
  // usageMetricsHourly.timestamp = event.block.timestamp;
  // usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  // usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  // usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // protocol.save();
  // usageMetricsDaily.save();
  // usageMetricsHourly.save();
}

// export function updateRTokenMetrics(
//   event: ethereum.Event,
//   rTokenId: string,
//   amount: BigInt,
//   entryType
// );

// Update usage metrics entities
export function updateTokenMetrics(
  event: ethereum.Event,
  tokenAddress: Address,
  fromAddress: Address,
  amount: BigInt,
  entryType: string
): void {
  let token = getOrCreateToken(tokenAddress);
  let from = fromAddress
    .toHexString()
    .concat("-")
    .concat(token.id);

  // Token snapshots
  let tokenDaily = getOrCreateTokenDailySnapshot(token.id, event);
  let tokenHourly = getOrCreateTokenHourlySnapshot(token.id, event);

  // Number of days since Unix epoch
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let dayId = day.toString();
  let hourId = hour.toString();

  // User data
  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = from.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);

  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    tokenDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  let hourlyActiveAccountId = from.concat("-").concat(hourId);
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

  tokenHourly.hourlyEventCount += INT_ONE;
  tokenHourly.blockNumber = event.block.number;
  tokenHourly.timestamp = event.block.timestamp;
  tokenHourly.save();

  tokenDaily.dailyEventCount += INT_ONE;
  tokenDaily.blockNumber = event.block.number;
  tokenDaily.timestamp = event.block.timestamp;
  tokenDaily.save();

  token.transferCount = token.transferCount.plus(BIGINT_ONE);
  token.save();
}
