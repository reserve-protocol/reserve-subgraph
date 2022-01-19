import { ERC20 } from "../generated/Deployer/ERC20";
import {
  Address,
  ByteArray,
  BigInt,
  crypto,
  Bytes,
} from "@graphprotocol/graph-ts";
import { TokenUser } from "../generated/schema";
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

export function getTokenUserId(tokenAddress: string, userAddr: Bytes): string {
  return tokenAddress.concat("-").concat(userAddr.toHexString());
}

export function getConcatenatedId(a: string, b: string): string {
  return a.concat("-").concat(b);
}

export function isTokenUserExist(tokenUser: TokenUser | null): boolean {
  return tokenUser != null;
}

export class TokenInfo {
  name!: string;
  symbol!: string;
  address!: string;
  decimals: i32;

  static build(address: Address): TokenInfo {
    let tokenInfo = new TokenInfo();
    let contract = ERC20.bind(address);
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
  static Stake: string = "Stake";
  static Unstake: string = "Unstake";
  static Issuance: string = "Issuance";
  static Redemption: string = "Redemption";
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

export class RSVInfo {
  static main: string = "0x5BA9d812f5533F7Cf2854963f7A9d212f8f28673";
  static address: string = "0x196f4727526eA7FB1e17b2071B3d8eAA38486988";
  static owner: string = "0xfc82f7d67facea4e93b8501f76ff5003cedccd89";
  static vaultId: string = "0x5BA9d812f5533F7Cf2854963f7A9d212f8f28673";
  static collaterals: string[] = [
    "0x8e870d67f660d95d5be530380d0ec0bd388289e1", // PAX
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
    "0x0000000000085d4780B73119b644AE5ecd22b376", // USDT
  ];
}
