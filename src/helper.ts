import { ERC20 } from "../generated/Deployer/ERC20";
import { Address, ByteArray, BigInt, crypto } from "@graphprotocol/graph-ts";
export let ADDRESS_ZERO = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export let BI_ZERO = BigInt.fromI32(0);
export let BI_ONE = BigInt.fromI32(1);

export function generateId(val: string): string {
  return crypto
    .keccak256(
      ByteArray.fromUTF8(val ? val : "" + new Date().getTime().toString())
    )
    .toHexString();
}

export class TokenInfo {
  name: string;
  symbol: string;
  address: string;
  decimals: i32;

static build(address: Address): TokenInfo {
    let tokenInfo = new TokenInfo();
    let contract = ERC20.bind(address)
    tokenInfo.address = address.toHexString();
    tokenInfo.name = contract.name();
    tokenInfo.symbol = contract.symbol();
    tokenInfo.decimals = contract.decimals();

    return tokenInfo;
  }
}

export class AddressType {
  static From: string = "From";
  static To: string = "To";
}

export class TokenType {
  static RSR: string = "RSR";
  static RToken: string = "RToken";
  static StakingToken: string = "StakingToken";
  static ERC20: string = "ERC20";
}

export class EntryType {
  static Mint: string = "Mint";
  static Burn: string = "Burn";
  static Transfer: string = "Transfer";
  static Stake: string = "Stake"
  static Unstake: string = "Unstake"
  static Issuance: string = "Issuance"
  static Redemption: string = "Redemption"
}

export class EntryStatus {
  static Pending: string = "Pending";
  static Canceled: string = "Canceled";
  static Completed: string = "Completed";
}

export class SystemMood {
  static CALM: string = "CALM";
  static DOUBT: string = "DOUBT";
  static TRADING: string = "TRADING";
}
