import { RToken } from "../generated/templates/RToken/RToken";
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

  static build(contract: RToken): TokenInfo {
    let tokenInfo = new TokenInfo();
    tokenInfo.address = contract._address.toHex();

    let tokenName = contract.try_name();
    tokenInfo.name = !tokenName.reverted
      ? tokenName.value
      : tokenInfoByContractAddress.get(contract._address).name;
    let tokenSymbol = contract.try_symbol();
    tokenInfo.symbol = !tokenSymbol.reverted
      ? tokenSymbol.value
      : tokenInfoByContractAddress.get(contract._address).symbol;

    return tokenInfo;
  }
}

export class AddressType {
  static From: string = "From";
  static To: string = "To";
}

export class TransactionType {
  static Mint: string = "Mint";
  static Burn: string = "Burn";
  static Transfer: string = "Transfer";
}

let tokenInfoByContractAddress = new Map<Address, TokenInfo>();
tokenInfoByContractAddress.set(
  Address.fromString("0x8E870D67F660D95d5be530380D0eC0bd388289E1"),
  {
    name: "Reserve Dollar",
    symbol: "RSD",
    address: "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
  }
);
