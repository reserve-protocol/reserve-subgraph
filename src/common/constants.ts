import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
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
export namespace Network {
  export const ARBITRUM = "arbitrum-one";
  export const BASE = "base";
  export const MAINNET = "mainnet"; // Ethereum mainnet
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
  export const FURNACE = "FURNACE";
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

export enum TradeKind {
  DUTCH_AUCTION,
  BATCH_AUCTION,
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

export const FACADE_ADDRESS_MAP = new Map<string, string>();
FACADE_ADDRESS_MAP.set(
  Network.MAINNET,
  "0x80b24e984e4fc92a4846b044286DcCcd66564DB9"
);
FACADE_ADDRESS_MAP.set(
  Network.BASE,
  "0xe1aa15DA8b993c6312BAeD91E0b470AE405F91BF"
);
FACADE_ADDRESS_MAP.set(
  Network.ARBITRUM,
  "0xEb2071e9B542555E90E6e4E1F83fa17423583991"
);

export const FACADE_ADDRESS = Address.fromString(
  FACADE_ADDRESS_MAP.get(dataSource.network()) as string
);

export const RSR_ADDRESS_MAP = new Map<string, string>();
RSR_ADDRESS_MAP.set(
  Network.MAINNET,
  "0x320623b8e4ff03373931769a31fc52a4e78b5d70"
);
RSR_ADDRESS_MAP.set(Network.BASE, "0xaB36452DbAC151bE02b16Ca17d8919826072f64a");
RSR_ADDRESS_MAP.set(
  Network.ARBITRUM,
  "0xCa5Ca9083702c56b481D1eec86F1776FDbd2e594"
);

export const RSR_ADDRESS = Address.fromString(
  RSR_ADDRESS_MAP.get(dataSource.network()) as string
);

export const RSR_CHAINLINK_CONTRACT_ADDRESS = new Map<string, Address>();
RSR_CHAINLINK_CONTRACT_ADDRESS.set(
  Network.MAINNET,
  Address.fromString("0x759bbc1be8f90ee6457c44abc7d443842a976d02")
);
RSR_CHAINLINK_CONTRACT_ADDRESS.set(
  Network.BASE,
  Address.fromString("0xAa98aE504658766Dfe11F31c5D95a0bdcABDe0b1")
);
RSR_CHAINLINK_CONTRACT_ADDRESS.set(
  Network.ARBITRUM,
  Address.fromString("0xcfF9349ec6d027f20fC9360117fef4a1Ad38B488")
);
