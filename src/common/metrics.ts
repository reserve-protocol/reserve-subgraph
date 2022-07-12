import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, RToken } from "../../generated/schema";
import {
  BIGINT_ONE,
  EntryType,
  INT_ONE,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  UsageType,
} from "./constants";
import {
  getOrCreateProtocol,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
  getOrCreateToken,
  getOrCreateTokenDailySnapshot,
  getOrCreateTokenHourlySnapshot,
  getOrCreateRTokenDailySnapshot,
  getOrCreateRTokenHourlySnapshot,
  getOrCreateAccountBalance,
} from "./getters";

// These are meant more as boilerplates that'll be filled out depending on the
// subgraph, and will be different from subgraph to subgraph, hence left
// partially implemented and commented out.
// They are common within a subgraph but not common across different subgraphs.

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

  
}

// Update usage metrics entities
export function updateUsageMetrics(
  event: ethereum.Event,
  tokenAddress: Address,
  fromAddress: Address,
  amount: BigInt,
  entryType: string
): void {
  let from = fromAddress.toHexString();
  let token = getOrCreateToken(tokenAddress);
  let userBalance = getOrCreateAccountBalance(fromAddress, tokenAddress);

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

  let hourlyActiveAccountId = from.concat("-").concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);

  // let account = Account.load(from);
  // if (!account) {
  //   account = new Account(from);
  //   protocol.cumulativeUniqueUsers += INT_ONE;
  //   account.save();
  // }

  // Update token supply and counts
  if (entryType === EntryType.MINT) {
    token.mintCount = token.mintCount.plus(BIGINT_ONE);
    token.totalMinted = token.totalMinted.plus(amount);
    token.totalSupply = token.totalSupply.plus(amount);

    tokenDaily.dailyBurnCount += INT_ONE;
    tokenDaily.dailyBurnAmount = tokenDaily.dailyBurnAmount.plus(amount);
    tokenDaily.dailyTotalSupply = tokenDaily.dailyTotalSupply.minus(amount);
  } else if (entryType === EntryType.BURN) {
    token.burnCount = token.burnCount.plus(BIGINT_ONE);
    token.totalBurned = token.totalBurned.plus(amount);
    token.totalSupply = token.totalSupply.minus(amount);
  }

  // Update token transfers
  if (
    entryType === EntryType.MINT ||
    entryType === EntryType.BURN ||
    entryType === EntryType.TRANSFER
  ) {
    token.transferCount = token.transferCount.plus(BIGINT_ONE);
  }

  // rToken specific mappings, RSV is the only case where this does not apply
  if (token.rToken) {
    let protocol = getOrCreateProtocol();
    let rToken = RToken.load(token.rToken)!;

    let usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
    let usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

    let rTokenDaily = getOrCreateRTokenDailySnapshot(rToken.id, event);
    let rTokenHourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

    if (entryType === EntryType.STAKE) {
    } else if (entryType === EntryType.UNSTAKE) {
    }

    // New user
    if (userBalance.transferCount === INT_ONE) {
      protocol.cumulativeUniqueUsers += INT_ONE;
    }

    // Update the block number and timestamp to that of the last transaction of that day
    usageMetricsDaily.blockNumber = event.block.number;
    usageMetricsDaily.timestamp = event.block.timestamp;
    usageMetricsDaily.dailyTransactionCount += INT_ONE;

    usageMetricsHourly.blockNumber = event.block.number;
    usageMetricsHourly.timestamp = event.block.timestamp;
    usageMetricsHourly.hourlyTransactionCount += INT_ONE;

    usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

    protocol.save();
    usageMetricsDaily.save();
    usageMetricsHourly.save();
  }

  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
  }

  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
  }

  token.save();
}

// Update Pool Snapshots entities
// export function updatePoolMetrics(event: ethereum.Event): void {
//   // get or create pool metrics
//   let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
//   let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);

//   let pool = getLiquidityPool(event.address.toHexString());

//   // Update the block number and timestamp to that of the last transaction of that day
//   poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
//   poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
//   poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
//   poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
//   poolMetricsDaily.outputTokenSupply = pool.outputTokenSupply;
//   poolMetricsDaily.outputTokenPriceUSD = pool.outputTokenPriceUSD;
//   poolMetricsDaily.blockNumber = event.block.number;
//   poolMetricsDaily.timestamp = event.block.timestamp;

//   poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
//   poolMetricsHourly.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
//   poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
//   poolMetricsHourly.inputTokenWeights = pool.inputTokenWeights;
//   poolMetricsHourly.outputTokenSupply = pool.outputTokenSupply;
//   poolMetricsHourly.outputTokenPriceUSD = pool.outputTokenPriceUSD;
//   poolMetricsHourly.blockNumber = event.block.number;
//   poolMetricsHourly.timestamp = event.block.timestamp;

//   poolMetricsDaily.save();
//   poolMetricsHourly.save();
// }
