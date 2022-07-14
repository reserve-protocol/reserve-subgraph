import { ERC20 } from "./../../../generated/Deployer/ERC20";
import * as constants from "./constants";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = ERC20.bind(tokenAddr);
  let decimals = constants.DEFAULT_DECIMALS;
  let result = token.try_decimals();

  if (!result.reverted) {
    decimals = BigInt.fromI32(result.value);
  }

  return decimals;
}
