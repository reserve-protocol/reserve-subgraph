import { BI_ZERO } from "./../utils/helper";
// import { log } from "@graphprotocol/graph-ts"
import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
  RTokenHourlySnapshot,
  RTokenDailySnapshot,
  TokenHourlySnapshot,
  TokenDailySnapshot,
  RToken,
  Account,
  AccountBalance,
  AccountBalanceDailySnapshot,
  Protocol,
} from "../../generated/schema";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "./tokens";
import {
  BIGDECIMAL_ZERO,
  Network,
  INT_ZERO,
  FACTORY_ADDRESS,
  ProtocolType,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
  SECONDS_PER_HOUR,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  TokenType,
} from "../common/constants";

export function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new Protocol(FACTORY_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    protocol.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    protocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.GENERIC;

    protocol.rsrStaked = BI_ZERO;
    protocol.rsrStakedValueUSD = BIGDECIMAL_ZERO;
    protocol.rsrUnstaked = BI_ZERO;
    protocol.rsrUnstakedValueUSD = BIGDECIMAL_ZERO;
    protocol.totalRTokenSupply = BI_ZERO;
    protocol.totalRTokenValueUSD = BIGDECIMAL_ZERO; // Maybe duplicated from cumulative volume
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

    usageMetrics.dailyRSRStaked = BI_ZERO;
    usageMetrics.dailyRSRStakedValueUSD = BIGDECIMAL_ZERO;
    usageMetrics.cumulativeRSRStaked = BI_ZERO;
    usageMetrics.cumulativeRSRStakedValueUSD = BIGDECIMAL_ZERO;
    usageMetrics.dailyRSRUnstaked = BI_ZERO;
    usageMetrics.dailyRSRUnstakedValueUSD = BIGDECIMAL_ZERO;
    usageMetrics.cumulativeRSRUnstaked = BI_ZERO;
    usageMetrics.cumulativeRSRUnstakedValueUSD = BIGDECIMAL_ZERO;

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

    usageMetrics.hourlyRSRStaked = BI_ZERO;
    usageMetrics.hourlyRSRStakedValueUSD = BIGDECIMAL_ZERO;
    usageMetrics.cumulativeRSRStaked = BI_ZERO;
    usageMetrics.cumulativeRSRStakedValueUSD = BIGDECIMAL_ZERO;
    usageMetrics.hourlyRSRUnstaked = BI_ZERO;
    usageMetrics.hourlyRSRUnstakedValueUSD = BIGDECIMAL_ZERO;
    usageMetrics.cumulativeRSRUnstaked = BI_ZERO;
    usageMetrics.cumulativeRSRUnstakedValueUSD = BIGDECIMAL_ZERO;

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

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;

    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateRTokenDailySnapshot(
  event: ethereum.Event
): RTokenDailySnapshot {
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let dayId = day.toString();
  let rTokenMetrics = RTokenDailySnapshot.load(
    event.address
      .toHexString()
      .concat("-")
      .concat(dayId)
  );

  if (!rTokenMetrics) {
    rTokenMetrics = new RTokenDailySnapshot(
      event.address
        .toHexString()
        .concat("-")
        .concat(dayId)
    );
    rTokenMetrics.protocol = FACTORY_ADDRESS;
    rTokenMetrics.pool = event.address.toHexString();
    rTokenMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.dailyVolumeUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.dailyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    rTokenMetrics.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    rTokenMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    rTokenMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    rTokenMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    rTokenMetrics.blockNumber = event.block.number;
    rTokenMetrics.timestamp = event.block.timestamp;

    rTokenMetrics.save();
  }

  return rTokenMetrics;
}

export function getOrCreateRTokenHourlySnapshot(
  event: ethereum.Event
): LiquidityPoolHourlySnapshot {
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let hourId = hour.toString();
  let poolMetrics = LiquidityPoolHourlySnapshot.load(
    event.address
      .toHexString()
      .concat("-")
      .concat(hourId)
  );

  if (!poolMetrics) {
    poolMetrics = new LiquidityPoolHourlySnapshot(
      event.address
        .toHexString()
        .concat("-")
        .concat(hourId)
    );
    poolMetrics.protocol = FACTORY_ADDRESS;
    poolMetrics.pool = event.address.toHexString();
    poolMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.hourlyVolumeByTokenAmount = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolMetrics.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    poolMetrics.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    poolMetrics.inputTokenWeights = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;

    poolMetrics.save();
  }

  return poolMetrics;
}

export function getOrCreateToken(
  tokenAddress: Address,
  type: string = TokenType.GENERIC,
  rTokenAddress?: string
): Token {
  let token = Token.load(tokenAddress.toHexString());
  // fetch info if null
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.holderCount = BI_ZERO;
    token.transferCount = BI_ZERO;
    token.mintCount = BI_ZERO;
    token.burnCount = BI_ZERO;
    token.totalSupply = BIGDECIMAL_ZERO;

    token.type = type;

    if (rTokenAddress) {
      token.rToken = rTokenAddress;
    }

    token.save();
  }
  return token;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}
