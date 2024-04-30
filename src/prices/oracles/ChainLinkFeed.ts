import { ChainLinkAggregator } from "./../../../generated/Deployer/ChainLinkAggregator";
import { Address } from "@graphprotocol/graph-ts";
import { ChainLinkContract } from "../../../generated/Deployer/ChainLinkContract";
import {
  RSR_ADDRESS,
  RSR_CHAINLINK_CONTRACT_ADDRESS,
} from "../../common/constants";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { CHAIN_LINK_CONTRACT_ADDRESS } from "../config/mainnet";

export function getTokenPriceFromChainLink(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const RSR_CHAINLINK_ADDRESS = RSR_CHAINLINK_CONTRACT_ADDRESS[
    network
  ] as Address;

  if (tokenAddr.equals(RSR_ADDRESS)) {
    const contract = ChainLinkAggregator.bind(RSR_CHAINLINK_ADDRESS);
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
