import { Address } from "@graphprotocol/graph-ts";
import { RToken, RTokenContract, Token } from "../../generated/schema";
import {
  BackingManager,
  BasketHandler,
  Distributor as DistributorTemplate,
  Main as MainTemplate,
  RToken as RTokenTemplate,
  RevenueTrader,
  stRSR as stRSRTemplate,
  stRSRVotes as stRSRVotesTemplate,
} from "../../generated/templates";
import {
  getOrCreateCollateral,
  getOrCreateProtocol,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../common/getters";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { RTokenCreated } from "./../../generated/Deployer/Deployer";
import { Facade } from "./../../generated/Deployer/Facade";
import { Main } from "./../../generated/Deployer/Main";

import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_TEN_TO_EIGHTEENTH,
  BIGINT_ZERO,
  ContractName,
  FACADE_ADDRESS,
  INT_ONE,
} from "./../common/constants";
import { hexToNumberString } from "../common/utils/strings";

// * Deployer events
export function handleCreateToken(event: RTokenCreated): void {
  let protocol = getOrCreateProtocol();

  // Create related tokens
  let token = getOrCreateToken(event.params.rToken);
  let rewardToken = getOrCreateRewardToken(event.params.stRSR);
  let stToken = Token.load(event.params.stRSR.toHexString())!;

  let facadeContract = Facade.bind(Address.fromString(FACADE_ADDRESS));
  let basketBreakdown = facadeContract.try_basketBreakdown(event.params.rToken);

  // Error on collateral, don't map token
  if (basketBreakdown.reverted) {
    return;
  }

  let shares = basketBreakdown.value.getUoaShares();
  let erc20s = basketBreakdown.value.getErc20s();
  let targetBytes = basketBreakdown.value.getTargets();

  let collaterals: string[] = [];
  let distribution: string[] = [];
  let targets: string[] = [];

  for (let i = 0; i < erc20s.length; i++) {
    let targetName = targetBytes[i].toString();

    if (targets.indexOf(targetName) == -1) {
      targets.push(targetName);
    }

    collaterals.push(getOrCreateCollateral(erc20s[i]).id);
    distribution.push(
      `"${erc20s[i].toHexString()}":{"dist":"${hexToNumberString(
        shares[i].toHex()
      )}","target":"${targetName}"}`
    );
  }

  // Create new RToken
  let rToken = new RToken(event.params.rToken.toHexString());
  rToken.protocol = protocol.id;
  rToken.token = token.id;
  rToken.rewardToken = rewardToken.id;
  rToken.createdTimestamp = event.block.timestamp;
  rToken.createdBlockNumber = event.block.number;
  rToken.owners = [event.params.owner.toHexString()];
  rToken.freezers = [];
  rToken.pausers = [];
  rToken.longFreezers = [];
  rToken.cumulativeUniqueUsers = INT_ONE;
  rToken.rewardTokenSupply = BIGINT_ZERO;
  rToken.rsrExchangeRate = BIGDECIMAL_ONE;
  rToken.rsrStaked = BIGINT_ZERO;
  rToken.totalRsrStaked = BIGINT_ZERO;
  rToken.totalRsrUnstaked = BIGINT_ZERO;
  rToken.basketRate = BIGDECIMAL_ONE;
  rToken.backing = BIGINT_ZERO;
  rToken.backingRSR = BIGINT_ZERO;
  rToken.stakersRewardShare = BIGDECIMAL_ZERO;
  rToken.holdersRewardShare = BIGDECIMAL_ZERO;
  rToken.cumulativeRTokenRevenue = BIGDECIMAL_ZERO;
  rToken.cumulativeStakerRevenue = BIGDECIMAL_ZERO;
  rToken.totalDistributedRSRRevenue = BIGINT_ZERO;
  rToken.totalDistributedRTokenRevenue = BIGINT_ZERO;
  rToken.rawRsrExchangeRate = BIGINT_TEN_TO_EIGHTEENTH;
  rToken.collaterals = collaterals;
  rToken.collateralDistribution = `{${distribution.join(",")}}`;
  rToken.targetUnits = targets.join(",");
  rToken.save();

  protocol.rTokenCount += INT_ONE;
  protocol.save();

  let currentPrice = facadeContract.price(event.params.rToken);
  token.rToken = rToken.id;
  token.lastPriceUSD = bigIntToBigDecimal(
    currentPrice
      .getHigh()
      .plus(currentPrice.getLow())
      .div(BIGINT_ONE.plus(BIGINT_ONE))
  );
  token.save();

  rewardToken.rToken = rToken.id;
  rewardToken.save();

  stToken.rToken = rToken.id;
  stToken.save();

  let mainContract = Main.bind(event.params.main);
  let main = new RTokenContract(event.params.main.toHexString());
  main.rToken = rToken.id;
  main.name = ContractName.MAIN;
  main.save();

  let backingManagerAddress = mainContract.backingManager();
  let backingManager = new RTokenContract(backingManagerAddress.toHexString());
  backingManager.rToken = rToken.id;
  backingManager.name = ContractName.BACKING_MANAGER;
  backingManager.save();

  let basketHandlerAddress = mainContract.basketHandler();
  let basketHandler = new RTokenContract(basketHandlerAddress.toHexString());
  basketHandler.rToken = rToken.id;
  basketHandler.name = ContractName.BASKET_HANDLER;
  basketHandler.save();

  let revenueTraderAddress = mainContract.rTokenTrader();
  let revenueTrader = new RTokenContract(revenueTraderAddress.toHexString());
  revenueTrader.rToken = rToken.id;
  revenueTrader.name = ContractName.RTOKEN_TRADER;
  revenueTrader.save();

  let rsrTraderAddress = mainContract.rsrTrader();
  let rsrTrader = new RTokenContract(rsrTraderAddress.toHexString());
  rsrTrader.rToken = rToken.id;
  rsrTrader.name = ContractName.RSR_TRADER;
  rsrTrader.save();

  let distributorAddress = mainContract.distributor();

  let distributor = new RTokenContract(distributorAddress.toHexString());
  distributor.rToken = rToken.id;
  distributor.name = ContractName.DISTRIBUTOR;
  distributor.save();

  // Initialize dynamic mappings for the new RToken system
  RTokenTemplate.create(event.params.rToken);
  stRSRTemplate.create(event.params.stRSR);
  stRSRVotesTemplate.create(event.params.stRSR);
  MainTemplate.create(event.params.main);
  DistributorTemplate.create(distributorAddress);
  BackingManager.create(backingManagerAddress);
  RevenueTrader.create(revenueTraderAddress);
  RevenueTrader.create(rsrTraderAddress);
  BasketHandler.create(basketHandlerAddress);
}
