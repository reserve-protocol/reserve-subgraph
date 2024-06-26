import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Deployer/ERC20";
import { Facade } from "../../generated/templates/RToken/Facade";
import { getUsdPricePerToken } from "../prices";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  FACADE_ADDRESS,
  RSR_ADDRESS,
} from "./constants";
import { bigIntToBigDecimal } from "./utils/numbers";

export const INVALID_TOKEN_DECIMALS = 18;
export const UNKNOWN_TOKEN_VALUE = "unknown";

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = UNKNOWN_TOKEN_VALUE;
  let symbolResult = contract.try_symbol();
  if (!symbolResult.reverted) {
    return symbolResult.value;
  } else {
    // try with the static definition
    let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress);
    if (staticTokenDefinition != null) {
      symbolValue = staticTokenDefinition.symbol;
    }
  }

  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = UNKNOWN_TOKEN_VALUE;
  let nameResult = contract.try_name();
  if (!nameResult.reverted) {
    return nameResult.value;
  } else {
    // try with the static definition
    let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress);
    if (staticTokenDefinition != null) {
      nameValue = staticTokenDefinition.name;
    }
  }

  return nameValue;
}

export function fetchTokenDecimals(tokenAddress: Address): i32 {
  let contract = ERC20.bind(tokenAddress);

  // try types uint8 for decimals
  let decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    let decimalValue = decimalResult.value;
    return decimalValue;
  }

  // try with the static definition
  let staticTokenDefinition = StaticTokenDefinition.fromAddress(tokenAddress);
  if (staticTokenDefinition != null) {
    return staticTokenDefinition.decimals as i32;
  } else {
    return INVALID_TOKEN_DECIMALS as i32;
  }
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

// Initialize a Token Definition with the attributes
class StaticTokenDefinition {
  address: Address;
  symbol: string;
  name: string;
  decimals: i32;

  // Initialize a Token Definition with its attributes
  // TODO: Yield tokens? only needed if we want to track the baskets
  constructor(address: Address, symbol: string, name: string, decimals: i32) {
    this.address = address;
    this.symbol = symbol;
    this.name = name;
    this.decimals = decimals;
  }

  // Get all tokens with a static defintion
  static getStaticDefinitions(): Array<StaticTokenDefinition> {
    let staticDefinitions = new Array<StaticTokenDefinition>(6);

    // Add RSR
    let tokenRSR = new StaticTokenDefinition(
      RSR_ADDRESS,
      "RSR",
      "Reserve Rights",
      18 as i32
    );
    staticDefinitions.push(tokenRSR);

    return staticDefinitions;
  }

  // Helper for hardcoded tokens
  static fromAddress(tokenAddress: Address): StaticTokenDefinition | null {
    let staticDefinitions = this.getStaticDefinitions();
    let tokenAddressHex = tokenAddress.toHexString();

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i];
      if (staticDefinition.address.toHexString() == tokenAddressHex) {
        return staticDefinition;
      }
    }

    // If not found, return null
    return null;
  }
}

export function getTokenPrice(address: Address): BigDecimal {
  let tokenPrice = BIGDECIMAL_ZERO;
  let fetchPrice = getUsdPricePerToken(address);

  if (!fetchPrice.reverted) {
    tokenPrice = fetchPrice.usdPrice.div(fetchPrice.decimalsBaseTen);
  }

  return tokenPrice;
}

// TODO: Use stored token record as fallback price?
export function getRSRPrice(): BigDecimal {
  return getTokenPrice(RSR_ADDRESS);
}

export function getRTokenPrice(address: Address): BigDecimal {
  let tokenPrice = BIGDECIMAL_ZERO;
  let contract = Facade.bind(FACADE_ADDRESS);
  let price = contract.try_price(address);

  if (!price.reverted) {
    tokenPrice = bigIntToBigDecimal(
      price.value
        .getHigh()
        .plus(price.value.getLow())
        .div(BIGINT_ONE.plus(BIGINT_ONE))
    );
  }

  return tokenPrice;
}
