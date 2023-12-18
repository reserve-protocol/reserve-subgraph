import { Address, BigDecimal, Value } from "@graphprotocol/graph-ts";
import {
  RToken,
  RTokenContract,
  RevenueDistribution,
  Token,
  Trade,
} from "../../generated/schema";
import { Timelock as TimelockTemplate } from "../../generated/templates";
import {
  BasketsNeededChanged,
  Transfer as TransferEvent,
} from "../../generated/templates/RToken/RToken";
import {
  getOrCreateCollateral,
  getOrCreateRTokenDailySnapshot,
  getOrCreateRTokenHourlySnapshot,
  getOrCreateTrade,
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

export function handleTokenTransfer(event: TransferEvent): void {
  handleTransfer(event);
}

export function handleBasketSet(event: PrimeBasketSet): void {
  let rTokenContract = RTokenContract.load(event.address.toHexString())!;
  let rToken = RToken.load(rTokenContract.rToken)!;

  let facadeContract = Facade.bind(Address.fromString(FACADE_ADDRESS));
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
}

// * rToken Events
// export function handleIssuance(event: Issuance): void {
//   let account = getTokenAccount(event.params.issuer, event.address);
//   let token = getOrCreateToken(event.address);

//   let entry = getOrCreateEntry(
//     event,
//     event.address.toHexString(),
//     account.id,
//     event.params.amount,
//     EntryType.ISSUE
//   );
//   entry.rToken = event.address.toHexString();
//   entry.amountUSD = bigIntToBigDecimal(event.params.amount).times(
//     token.lastPriceUSD
//   );
//   entry.save();

// updateRTokenMetrics(
//   event,
//   event.address,
//   event.params.amount,
//   EntryType.ISSUE
// );
// }

// export function handleRedemption(event: Redemption): void {
//   let account = getTokenAccount(event.params.redeemer, event.address);
//   let token = getOrCreateToken(event.address);

//   let entry = getOrCreateEntry(
//     event,
//     event.address.toHexString(),
//     account.id,
//     event.params.amount,
//     EntryType.REDEEM
//   );
//   entry.rToken = event.address.toHexString();
//   entry.amountUSD = bigIntToBigDecimal(BIGINT_ZERO).times(token.lastPriceUSD);
//   entry.save();

// updateRTokenMetrics(event, event.address, BIGINT_ZERO, EntryType.REDEEM);
// }

// * Rewards
export function handleRTokenBaskets(event: BasketsNeededChanged): void {
  let rToken = RToken.load(event.address.toHexString())!;
  let token = Token.load(rToken.token)!;
  let daily = getOrCreateRTokenDailySnapshot(rToken.id, event);
  let hourly = getOrCreateRTokenHourlySnapshot(rToken.id, event);

  let contract = Facade.bind(Address.fromString(FACADE_ADDRESS));
  let backing = contract.try_backingOverview(event.address);

  if (!backing.reverted) {
    rToken.backing = backing.value.getBacking();
    rToken.backingRSR = backing.value.getOverCollateralization();
  }

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
