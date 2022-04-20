import { ERC20 } from "../../generated/RSR/ERC20";
import {
  Address,
  ByteArray,
  BigInt,
  crypto,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import { TokenUser } from "../../generated/schema";
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

export function getEntryId(
  tokenId: string,
  entryType: string,
  id: string
): string {
  return getConcatenatedId(getConcatenatedId(tokenId, entryType), id);
}

export function isTokenUserExist(tokenUser: TokenUser | null): boolean {
  return tokenUser != null;
}

export function getTotalSupply(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress);

  return contract.totalSupply();
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

    if (isRSV(address)) {
      tokenInfo.name = "Reserve";
      tokenInfo.symbol = "RSV";
      tokenInfo.decimals = 18;
    } else {
      tokenInfo.name = contract.name();
      tokenInfo.symbol = contract.symbol();
      tokenInfo.decimals = contract.decimals();
    }

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
  static Withdraw: string = "Withdraw";
  static Issuance: string = "Issuance";
  static Redemption: string = "Redemption";
}

export class EntryStatus {
  static Pending: string = "Pending";
  static Canceled: string = "Canceled";
  static Completed: string = "Completed";
}

export class RSVInfo {
  static main: string = "0x4b481872f31bab47c6780d5488c84d309b1b8bb6";
  static address: string = "0x196f4727526ea7fb1e17b2071b3d8eaa38486988";
  static owner: string = "0xfc82f7d67facea4e93b8501f76ff5003cedccd89";
  static vaultId: string = "0xAeDCFcdD80573c2a312d15d6Bb9d921a01E4FB0f";
  static collaterals: string[] = [
    "0x8e870d67f660d95d5be530380d0ec0bd388289e1", // PAX
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
    "0x0000000000085d4780B73119b644AE5ecd22b376", // USDT
  ];
}

export function isRSV(address: Address): boolean {
  let addressString = address.toHexString();

  return (
    addressString == RSVInfo.address ||
    addressString == RSVInfo.main ||
    addressString == RSVInfo.vaultId
  );
}
