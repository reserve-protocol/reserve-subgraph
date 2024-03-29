import {
  Address,
  BigDecimal,
  dataSource,
  BigInt,
} from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Reserve Protocol";
export const PROTOCOL_SLUG = "reserveprotocol-v1";
export const PROTOCOL_SCHEMA_VERSION = "1.0.0";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

// CUSTOM
export namespace EntryType {
  export const TRANSFER = "TRANSFER";
  export const ISSUE = "ISSUE";
  export const REDEEM = "REDEEM";
  export const CLAIM = "CLAIM";
  export const STAKE = "STAKE";
  export const UNSTAKE = "UNSTAKE";
  export const UNSTAKE_CANCELLED = "UNSTAKE_CANCELLED";
  export const WITHDRAW = "WITHDRAW";
  export const BURN = "BURN";
  export const MINT = "MINT";
}

export namespace GovernanceType {
  export const ALEXIOS = "ALEXIOS";
  export const CUSTOM = "CUSTOM";
}

export namespace Roles {
  export const OWNER = "OWNER";
  export const PAUSER = "PAUSER";
  export const SHORT_FREEZER = "SHORT_FREEZER";
  export const LONG_FREEZER = "LONG_FREEZER";
}

export namespace ContractName {
  export const BACKING_MANAGER = "BACKING_MANAGER";
  export const RTOKEN_TRADER = "RTOKEN_TRADER";
  export const MAIN = "MAIN";
  export const DISTRIBUTOR = "DISTRIBUTOR";
  export const TIMELOCK = "TIMELOCK";
  export const GOVERNOR = "GOVERNOR";
  export const RSR_TRADER = "RSR_TRADER";
  export const BASKET_HANDLER = "BASKET_HANDLER";
}

export namespace ProposalState {
  export const PENDING = "PENDING";
  export const ACTIVE = "ACTIVE";
  export const CANCELED = "CANCELED";
  export const DEFEATED = "DEFEATED";
  export const SUCCEEDED = "SUCCEEDED";
  export const QUEUED = "QUEUED";
  export const EXPIRED = "EXPIRED";
  export const EXECUTED = "EXECUTED";
}

export namespace VoteChoice {
  export const AGAINST_VALUE = 0;
  export const FOR_VALUE = 1;
  export const ABSTAIN_VALUE = 2;
  export const AGAINST = "AGAINST";
  export const FOR = "FOR";
  export const ABSTAIN = "ABSTAIN";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const FURNACE_ADDRESS = "0x0000000000000000000000000000000000000001";
export const ST_RSR_ADDRESS = "0x0000000000000000000000000000000000000002";

export const FACADE_ADDRESS =
  dataSource.network() == "mainnet"
    ? "0x80b24e984e4fc92a4846b044286DcCcd66564DB9"
    : "0xe1aa15DA8b993c6312BAeD91E0b470AE405F91BF";

// Tokens
export const RSR_ADDRESS = Address.fromString(
  dataSource.network() == "mainnet"
    ? "0x320623b8e4ff03373931769a31fc52a4e78b5d70"
    : "0xaB36452DbAC151bE02b16Ca17d8919826072f64a"
);
export const RSV_ADDRESS = Address.fromString(
  "0x196f4727526eA7FB1e17b2071B3d8eAA38486988"
);

export enum TradeKind {
  DUTCH_AUCTION,
  BATCH_AUCTION,
}
