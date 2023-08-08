import { Address, BigDecimal, Value } from "@graphprotocol/graph-ts";
import {
  RToken,
  RTokenContract,
  RevenueDistribution,
  Token,
} from "../../generated/schema";
import {
  BackingManager,
  Distributor as DistributorTemplate,
  Governance as GovernanceTemplate,
  Main as MainTemplate,
  RToken as RTokenTemplate,
  RevenueTrader,
  Timelock as TimelockTemplate,
  stRSR as stRSRTemplate,
  stRSRVotes as stRSRVotesTemplate,
} from "../../generated/templates";
import {
  BasketsNeededChanged,
  Issuance,
  Redemption,
  Transfer as TransferEvent,
} from "../../generated/templates/RToken/RToken";
import {
  getOrCreateEntry,
  getOrCreateProtocol,
  getOrCreateRTokenDailySnapshot,
  getOrCreateRTokenHourlySnapshot,
  getOrCreateRewardToken,
  getOrCreateToken,
  getOrCreateTrade,
  getTokenAccount,
} from "../common/getters";
import {
  updateRSRRevenueDistributed,
  updateRTokenMetrics,
  updateRTokenRevenueDistributed,
} from "../common/metrics";
import { fetchTokenDecimals, getRSRPrice } from "../common/tokens";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { RTokenCreated } from "./../../generated/Deployer/Deployer";
import { Facade } from "./../../generated/Deployer/Facade";
import { Main } from "./../../generated/Deployer/Main";
// import { DeploymentRegistered } from "./../../generated/Register/Register";
import {
  RoleGranted,
  RoleRevoked,
} from "./../../generated/templates/Deployer/Main";
import {
  DistributionSet,
  RevenueDistributed,
} from "./../../generated/templates/Distributor/Distributor";
import { Timelock } from "./../../generated/templates/Main/Timelock";
import {
  TradeSettled,
  TradeStarted,
} from "./../../generated/templates/RevenueTrader/RevenueTrader";

import { removeFromArrayAtIndex } from "../common/utils/arrays";
import { getGovernance } from "../governance/handlers";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  ContractName,
  EntryType,
  FACADE_ADDRESS,
  FURNACE_ADDRESS,
  INT_ONE,
  RSR_ADDRESS,
  Roles,
  ST_RSR_ADDRESS,
} from "./../common/constants";
import { handleTransfer } from "./common";

// * Tracks new deployments of the protocol
// export function handleProtocolDeployed(event: DeploymentRegistered): void {
//   Deployer.create(event.params.deployer);
// }

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

  let targets: string[] = [];
  let targetBytes = basketBreakdown.value.getTargets();

  for (let i = 0; i < targetBytes.length; i++) {
    let targetName = targetBytes[i].toString();

    if (targets.indexOf(targetName) == -1) {
      targets.push(targetName);
    }
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
  rToken.rsrPriceUSD = getRSRPrice();
  rToken.rsrPriceLastBlock = event.block.number;
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
  rToken.targetUnits = targets.join(",");
  rToken.save();

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
}

export function handleTokenTransfer(event: TransferEvent): void {
  handleTransfer(event);
}

// * rToken Events

export function handleIssuance(event: Issuance): void {
  let account = getTokenAccount(event.params.issuer, event.address);
  let token = getOrCreateToken(event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    event.params.amount,
    EntryType.ISSUE
  );
  entry.rToken = event.address.toHexString();
  entry.amountUSD = bigIntToBigDecimal(event.params.amount).times(
    token.lastPriceUSD
  );
  entry.save();

  updateRTokenMetrics(
    event,
    event.address,
    event.params.amount,
    EntryType.ISSUE
  );
}

export function handleRedemption(event: Redemption): void {
  let account = getTokenAccount(event.params.redeemer, event.address);
  let token = getOrCreateToken(event.address);

  let entry = getOrCreateEntry(
    event,
    event.address.toHexString(),
    account.id,
    event.params.amount,
    EntryType.REDEEM
  );
  entry.rToken = event.address.toHexString();
  entry.amountUSD = bigIntToBigDecimal(BIGINT_ZERO).times(token.lastPriceUSD);
  entry.save();

  updateRTokenMetrics(event, event.address, BIGINT_ZERO, EntryType.REDEEM);
}

// * Rewards
export function handleRTokenBaskets(event: BasketsNeededChanged): void {
  let rToken = RToken.load(event.address.toHexString())!;
  let token = Token.load(rToken.token)!;
  let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  if (event.params.newBasketsNeeded.equals(BIGINT_ZERO)) {
    rToken.basketRate = BIGDECIMAL_ZERO;
  } else {
    rToken.basketRate = token.totalSupply
      .div(event.params.newBasketsNeeded)
      .toBigDecimal();
  }

  rToken.save();

  daily.basketRate = rToken.basketRate;
  hourly.basketRate = rToken.basketRate;

  daily.save();
  hourly.save();
}

export function handleTrade(event: TradeStarted): void {
  getOrCreateTrade(event);
}

export function handleTradeSettled(event: TradeSettled): void {
  const trade = getOrCreateTrade(event);
  let buyTokenDecimals = fetchTokenDecimals(event.params.buy);

  trade.isSettled = true;
  trade.boughtAmount = bigIntToBigDecimal(
    event.params.buyAmount,
    buyTokenDecimals
  );
  trade.save();
}

export function handleRoleGranted(event: RoleGranted): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;

  let role = roleToProp(event.params.role.toString());
  let current = rToken.get(role)!.toStringArray();

  if (current.indexOf(event.params.account.toHexString()) == -1) {
    current.push(event.params.account.toHexString());
    rToken.set(role, Value.fromStringArray(current));
    rToken.save();

    // Check if the address is a timelock address if so, start indexing roles
    if (event.params.role.toString() == Roles.OWNER) {
      let contract = Timelock.bind(event.params.account);
      let tx = contract.try_PROPOSER_ROLE();
      // Check if the address is a timelock, if it is start indexing
      if (!tx.reverted) {
        let timelockContract = new RTokenContract(
          event.params.account.toHexString()
        );
        timelockContract.rToken = rToken.id;
        timelockContract.name = ContractName.TIMELOCK;
        timelockContract.save();
        TimelockTemplate.create(event.params.account);
      }
    }
  }
}

export function handleTimelockRoleGranted(event: RoleGranted): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;
  let gov = getGovernance(rToken.id);

  let timelockContract = Timelock.bind(event.address);
  let proposalRole = timelockContract.PROPOSER_ROLE();
  let guardianRole = timelockContract.CANCELLER_ROLE();

  if (event.params.role.equals(proposalRole)) {
    // Init governance
    // TODO: Multiple governance are supported but not really the case
    let governorContract = new RTokenContract(
      event.params.account.toHexString()
    );
    governorContract.rToken = rToken.id;
    governorContract.name = ContractName.GOVERNOR;
    governorContract.save();
    GovernanceTemplate.create(event.params.account);
  } else if (event.params.role.equals(guardianRole)) {
    // TODO: guardians should be related to the governanceFramework and not the Governance entity
    // TODO: Leave it on the governance entity in the meantime, the issue is getting the proposal role from timelock and figure out the proposal address
    let current = gov.get("guardians")!.toStringArray();
    current.push(event.params.account.toHexString());
    gov.guardians = current;
    gov.save();
  }
}

export function handleTimelockRoleRevoked(event: RoleRevoked): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;

  let timelockContract = Timelock.bind(event.address);
  let guardianRole = timelockContract.CANCELLER_ROLE();

  if (event.params.role.equals(guardianRole)) {
    let gov = getGovernance(rToken.id);
    let current = gov.guardians;
    let index = current.indexOf(event.params.account.toHexString());

    if (index != -1) {
      gov.guardians = removeFromArrayAtIndex(current, index);
      gov.save();
    }
  }
}

export function handleRoleRevoked(event: RoleRevoked): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;

  let role = roleToProp(event.params.role.toString());
  let current = rToken.get(role)!.toStringArray();
  let index = current.indexOf(event.params.account.toHexString());

  if (index != -1) {
    rToken.set(
      role,
      Value.fromStringArray(removeFromArrayAtIndex(current, index))
    );
    rToken.save();
  }
}

export function handleDistribution(event: DistributionSet): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;

  let id = event.params.dest
    .toHexString()
    .concat("-")
    .concat(rTokenContract.rToken);

  let distribution = RevenueDistribution.load(id);

  if (!distribution) {
    distribution = new RevenueDistribution(id);
    distribution.rToken = rTokenContract.rToken;
    distribution.destination = event.params.dest.toHexString();
  }
  distribution.rTokenDist = event.params.rTokenDist;
  distribution.rsrDist = event.params.rsrDist;
  distribution.save();

  const totalShares = BigDecimal.fromString("10000");

  if (event.params.dest.toHexString() == FURNACE_ADDRESS) {
    rToken.holdersRewardShare = BigDecimal.fromString(
      event.params.rTokenDist.toString()
    )
      .times(BigDecimal.fromString("100"))
      .div(totalShares);

    rToken.save();
  } else if (event.params.dest.toHexString() == ST_RSR_ADDRESS) {
    rToken.stakersRewardShare = BigDecimal.fromString(
      event.params.rsrDist.toString()
    )
      .times(BigDecimal.fromString("100"))
      .div(totalShares);

    rToken.save();
  }
}

export function handleRevenueDistributed(event: RevenueDistributed): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;
  let amount = bigIntToBigDecimal(event.params.amount);

  // Revenue for stakers
  if (event.params.erc20.equals(RSR_ADDRESS)) {
    // Calculate shares for stakers
    let stakersRevenue = amount
      .times(rToken.stakersRewardShare)
      .div(BigDecimal.fromString("100"));

    updateRSRRevenueDistributed(
      rToken,
      event.params.amount,
      stakersRevenue,
      event
    );
  } else {
    // Calculate shares for stakers
    let holdersRevenue = amount
      .times(rToken.holdersRewardShare)
      .div(BigDecimal.fromString("100"));

    updateRTokenRevenueDistributed(
      rToken,
      event.params.amount,
      holdersRevenue,
      event
    );
  }
}

function roleToProp(role: string): string {
  if (role == Roles.OWNER) {
    return "owners";
  } else if (role == Roles.PAUSER) {
    return "pausers";
  } else if (role == Roles.SHORT_FREEZER) {
    return "freezers";
  }

  return "longFreezers";
}
