import { ChainLinkAggregator } from "./../../../generated/Deployer/ChainLinkAggregator";
import { Address } from "@graphprotocol/graph-ts";
import { ChainLinkContract } from "../../../generated/Deployer/ChainLinkContract";
import { RSR_ADDRESS, RSV_ADDRESS } from "../../common/constants";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { CHAIN_LINK_CONTRACT_ADDRESS } from "../config/mainnet";

// TODO: CHange this to an address map?
const RSR_CHAINLINK_ADDRESS = Address.fromString(
  "0x759bbc1be8f90ee6457c44abc7d443842a976d02"
);
const RSR_BASE_CHAINLINK_ADDRESS = Address.fromString(
  "0xAa98aE504658766Dfe11F31c5D95a0bdcABDe0b1"
);
const USDC_CHAINLINK_ADDRESS = Address.fromString(
  "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6"
);

export function getTokenPriceFromChainLink(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  if (tokenAddr.equals(RSR_ADDRESS)) {
    const contract = ChainLinkAggregator.bind(
      network == "mainnet" ? RSR_CHAINLINK_ADDRESS : RSR_BASE_CHAINLINK_ADDRESS
    );

    const result = contract.try_latestRoundData();

    if (!result.reverted) {
      return CustomPriceType.initialize(result.value.value1.toBigDecimal(), 8);
    }
  } else if (tokenAddr.equals(RSV_ADDRESS)) {
    const contract = ChainLinkAggregator.bind(USDC_CHAINLINK_ADDRESS);

    const result = contract.try_latestRoundData();

    if (!result.reverted) {
      return CustomPriceType.initialize(result.value.value1.toBigDecimal(), 8);
    }
  } else {
    const contract = ChainLinkContract.bind(CHAIN_LINK_CONTRACT_ADDRESS);

    const result = contract.try_latestRoundData(
      tokenAddr,
      constants.CHAIN_LINK_USD_ADDRESS
    );

    if (!result.reverted) {
      const decimals = contract.try_decimals(
        tokenAddr,
        constants.CHAIN_LINK_USD_ADDRESS
      );

      if (decimals.reverted) {
        new CustomPriceType();
      }

      return CustomPriceType.initialize(
        result.value.value1.toBigDecimal(),
        decimals.value
      );
    }
  }

  return new CustomPriceType();
}
