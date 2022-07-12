import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { ActiveAccount, RToken } from "../../generated/schema";
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

// export function updateRTokenMetrics(
//   event: ethereum.Event,
//   rTokenId: string,
//   amount: BigInt,
//   entryType
// );

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

export function updateAccountBalance(
  accountAddress: Address,
  tokenAddress: Address,
  amount: BigInt,
  event: ethereum.Event
): void {
  // update balance
  let accountBalance = getOrCreateAccountBalance(accountAddress, tokenAddress);
  let balance = accountBalance.amount.plus(amount.toBigDecimal());

  if (accountBalance.amount.le(BIGDECIMAL_ZERO) && amount.gt(BIGINT_ZERO)) {
    updateTokenHolder(tokenAddress, true, event);
  } else if (balance.le(BIGDECIMAL_ZERO)) {
    updateTokenHolder(tokenAddress, false, event);
  }

  accountBalance.transferCount += INT_ONE;
  accountBalance.amount = balance;
  accountBalance.blockNumber = event.block.number;
  accountBalance.timestamp = event.block.timestamp;
  accountBalance.save();

  // update snapshot
  let accountBalanceSnapshot = getOrCreateAccountBalanceDailySnapshot(
    accountAddress,
    tokenAddress,
    event
  );
  accountBalanceSnapshot.amount = accountBalance.amount;
  accountBalanceSnapshot.transferCount = accountBalance.transferCount;
  accountBalanceSnapshot.blockNumber = accountBalance.blockNumber;
  accountBalanceSnapshot.timestamp = accountBalance.timestamp;
  accountBalanceSnapshot.transferCount = accountBalance.transferCount;
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

  // protocol metrics
  let usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  let usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  // rToken metrics
  let rTokenDaily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  let rTokenHourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  // TODO: Total value lock
  // TODO: Revenue
  switch (entryType) {
    case EntryType.MINT:
      // TODO: TVL
      // TODO: Value USD
      // TODO: Volume
      break;
    case EntryType.BURN:
      // TODO: Volume
      // TODO: Value USD
      break;
    case EntryType.TRANSFER:
      // TODO: Volume
      // TODO: Volume USD
      break;
    case EntryType.STAKE:
      protocol.insurance = protocol.insurance.plus(amount);
      protocol.rsrStaked = protocol.rsrStaked.plus(amount);
      // TODO: rsrStakedUSD

      usageMetricsDaily.dailyRSRStaked = usageMetricsDaily.dailyRSRStaked.plus(
        amount
      );
      usageMetricsDaily.cumulativeRSRStaked = protocol.rsrStaked;
      // rToken
      rToken.insurance = rToken.insurance.plus(amount);
      rTokenDaily.insurance = rToken.insurance;
      rTokenHourly.insurance = rToken.insurance;
      break;
    case EntryType.UNSTAKE:
      // Protocol
      protocol.rsrUnstaked = protocol.rsrUnstaked.plus(amount);
      usageMetricsDaily.dailyRSRUnstaked = usageMetricsDaily.dailyRSRStaked.plus(
        amount
      );
      usageMetricsDaily.cumulativeRSRUnstaked = protocol.rsrStaked;
      // rToken
      rToken.rsrUnstaked = rToken.rsrUnstaked.plus(amount);
      rTokenDaily.dailyRSRUnstaked = rTokenDaily.dailyRSRUnstaked.plus(amount);
      rTokenDaily.cumulativeRSRUnstaked = rToken.rsrUnstaked;
      break;
    case EntryType.WITHDRAW:
      protocol.insurance = protocol.insurance.minus(amount);
      // rToken
      rToken.insurance = rToken.insurance.minus(amount);
      rTokenDaily.insurance = rToken.insurance;
      rTokenHourly.insurance = rToken.insurance;
      break;
  }

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

  protocol.save();
  usageMetricsDaily.save();
  usageMetricsHourly.save();

  // Update protocol financial metrics snapshot
  updateFinancials(event);
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
  let from = fromAddress
    .toHexString()
    .concat("-")
    .concat(token.id);

  // Token snapshots
  let tokenDaily = getOrCreateTokenDailySnapshot(token.id, event);
  let tokenHourly = getOrCreateTokenHourlySnapshot(token.id, event);

  let [dayId, hourId] = getTimeIds(event);

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

  // For tokens that are not RSV
  if (token.rToken) {
    updateRTokenMetrics(
      event,
      Address.fromString(token.rToken),
      amount,
      entryType
    );
  }
}

function getTimeIds(event: ethereum.Event): [string, string] {
  // Number of days since Unix epoch
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  return [day.toString(), hour.toString()];
}
