import {
  Address,
  BigDecimal,
  Value,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import {
  Governance,
  RToken,
  RTokenContract,
  RevenueDistribution,
  Token,
  Trade,
} from "../../generated/schema";
import { Timelock as TimelockTemplate } from "../../generated/templates";
import { Governance as GovernanceTemplate } from "../../generated/templates";
import {
  BasketsNeededChanged,
  Transfer as TransferEvent,
} from "../../generated/templates/RToken/RToken";
import {
  getOrCreateCollateral,
  getOrCreateTokenDailySnapshot,
  getOrCreateTokenHourlySnapshot,
  getOrCreateTrade,
  updateRTokenHistoricalBaskets,
} from "../common/getters";
import {
  updateRSRRevenueDistributed,
  updateRTokenRevenueDistributed,
} from "../common/metrics";
import { fetchTokenDecimals } from "../common/tokens";
import { bigIntToBigDecimal } from "../common/utils/numbers";
import { PrimeBasketSet } from "./../../generated/templates/BasketHandler/BasketHandler";
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

import { Facade } from "../../generated/templates/RToken/Facade";
import { removeFromArrayAtIndex } from "../common/utils/arrays";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ContractName,
  FACADE_ADDRESS,
  FURNACE_ADDRESS,
  RSR_ADDRESS,
  Roles,
  ST_RSR_ADDRESS,
} from "./../common/constants";
import { handleTransfer } from "./common";
import { getGovernanceFramework } from "./governance";
import { SPELL_3_4_0_TIMELOCK_GOVERNANCE } from "../common/spells";

export function handleTokenTransfer(event: TransferEvent): void {
  handleTransfer(event);
}

export function handleBasketSet(event: PrimeBasketSet): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;

  let facadeContract = Facade.bind(FACADE_ADDRESS);
  let basketBreakdown = facadeContract.try_basketBreakdown(
    Address.fromString(rTokenContract.rToken)
  );

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
      `"${erc20s[i].toHexString()}":{"dist":"${bigIntToBigDecimal(
        shares[i]
      ).toString()}","target":"${targetName}"}`
    );
  }

  rToken.collaterals = collaterals;
  rToken.collateralDistribution = `{${distribution.join(",")}}`;
  rToken.targetUnits = targets.join(",");
  rToken.save();
  updateRTokenHistoricalBaskets(event, rToken);
}

// * Rewards
export function handleRTokenBaskets(event: BasketsNeededChanged): void {
  let rToken = RToken.load(event.address.toHexString())!;
  let token = Token.load(rToken.token)!;
  let daily = getOrCreateTokenDailySnapshot(rToken.id, event);
  let hourly = getOrCreateTokenHourlySnapshot(rToken.id, event);

  let contract = Facade.bind(FACADE_ADDRESS);
  let backing = contract.try_backingOverview(event.address);

  if (!backing.reverted) {
    rToken.backing = backing.value.getBacking();
    rToken.backingRSR = backing.value.getOverCollateralization();
  }

  if (token.totalSupply.equals(BIGINT_ZERO)) {
    token.basketRate = BIGDECIMAL_ZERO;
  } else {
    token.basketRate = event.params.newBasketsNeeded.divDecimal(
      token.totalSupply.toBigDecimal()
    );
  }

  rToken.basketsNeeded = event.params.newBasketsNeeded;
  rToken.save();
  token.save();

  daily.basketRate = token.basketRate;
  hourly.basketRate = token.basketRate;

  daily.save();
  hourly.save();
}

export function handleTrade(event: TradeStarted): void {
  getOrCreateTrade(event);
}

export function handleTradeSettle(event: TradeSettled): void {
  const trade = Trade.load(event.params.trade.toHexString())!;
  let buyTokenDecimals = fetchTokenDecimals(event.params.buy);

  trade.isSettled = true;
  trade.settleTxHash = event.transaction.hash.toHexString();
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
        let timelockAddress = event.params.account;
        let timelockContract = new RTokenContract(
          timelockAddress.toHexString()
        );
        timelockContract.rToken = rToken.id;
        timelockContract.name = ContractName.TIMELOCK;
        timelockContract.save();
        TimelockTemplate.create(event.params.account);

        let governance = Governance.load(rTokenContract.rToken);
        let hasTimelock = false;
        if (governance) {
          hasTimelock = governance.governanceFrameworks.load().length > 0;
        }

        // The timelock has been changed. Happened first time on the 3.4.0 upgrade
        if (hasTimelock) {
          log.error("Timelock has been changed", []);

          let network = dataSource.network();

          let governanceAddress =
            SPELL_3_4_0_TIMELOCK_GOVERNANCE[network][
              timelockAddress.toHexString()
            ];

          // Init governance
          let governorContract = new RTokenContract(
            governanceAddress.toHexString()
          );
          governorContract.rToken = rToken.id;
          governorContract.name = ContractName.GOVERNOR;
          governorContract.save();
          GovernanceTemplate.create(governanceAddress);

          // Init governance framework
          getGovernanceFramework(
            governanceAddress.toHexString(),
            event.block.number,
            event.block.timestamp
          );
          log.error("Created new governanceFramework", []);
        }
      }
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

  updateRTokenHistoricalBaskets(event, rToken);
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
