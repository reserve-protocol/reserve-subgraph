import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Collateral, Main, Token, TokenDayData } from "../generated/schema";
import {
  BasketHandler as BasketHandlerTemplate,
  RToken as RTokenTemplate,
  stRSR as stRSRTemplate,
} from "../generated/templates";
import {
  IssuancesCanceled,
  IssuancesCompleted,
  IssuanceStarted,
  Redemption,
  BasketsNeededChanged,
  Transfer as TransferEvent,
} from "../generated/templates/RToken/RToken";
import {
  Staked,
  UnstakingCompleted,
  UnstakingStarted,
} from "../generated/templates/stRSR/stRSR";
import { RTokenCreated } from "./../generated/Deployer/Deployer";
import { Facade } from "./../generated/Deployer/Facade";
import { Main as MainContract } from "./../generated/Deployer/Main";
import { Entry } from "./../generated/schema";
import { BasketSet } from "./../generated/templates/BasketHandler/BasketHandler";
import {
  getBasket,
  getBasketHandler,
  getMain,
  getMainUser,
  getSupply,
  getSupplyInitial,
  getToken,
  getTokenInitial,
  getTokenUser,
  getTransaction,
  getUser,
} from "./utils/getters";
import {
  AddressType,
  ADDRESS_ZERO,
  BI_ONE,
  BI_ZERO,
  EntryStatus,
  EntryType,
  getConcatenatedId,
  getEntryId,
  TokenType,
} from "./utils/helper";

// DoD
// Research how to calculate APY rate for:
// RToken holding
// StRSR staking

// Research topics:
// Luis: get familiar with the calculations
// How to get this data from the protocol events?
// How to store this data on theGraph?
// How to consume and generate charts for APY (ranges of time)

// ## Results
// For RToken APY:

// Listen for BasketsNeededChanged(basketsNeeded, basketsNeeded_) from the RToken contract, and query basketsNeeded as well from the RToken.
// The difference in % is the appreciation rate of this specific RToken, this can be stored in theGraph and query this value change over time to get the mean value of the appreciation by any given time.

// For stRSR:
// Listen for rsrSeized or rsrRewarded, and then query for totalStakes and stakeRSR, the formula totalStakes / stakeRSR give the amount of appreciation of this given stRSR.
// Store this value inside a entity on theGraph and query over time.

export function updateTokenDayData(
  token: Token,
  appreciationRate: BigInt,
  event: ethereum.Event
): TokenDayData {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;
  let tokenDayID = token.id
    .toString()
    .concat("-")
    .concat(dayID.toString());

  let tokenDayData = TokenDayData.load(tokenDayID);
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID);
    tokenDayData.date = dayStartTimestamp;
    tokenDayData.token = token.id;
    tokenDayData.open = appreciationRate;
    tokenDayData.high = appreciationRate;
    tokenDayData.low = appreciationRate;
    tokenDayData.close = appreciationRate;
  }

  if (appreciationRate.gt(tokenDayData.high)) {
    tokenDayData.high = appreciationRate;
  }

  if (appreciationRate.lt(tokenDayData.low)) {
    tokenDayData.low = appreciationRate;
  }

  tokenDayData.close = appreciationRate;
  tokenDayData.save();

  return tokenDayData as TokenDayData;
}

/**
 * * Event handlers
 */

// * Handle baskets UoA ratio change, updates appreciation rate of an rToken
export function handleRTokenBaskets(event: BasketsNeededChanged): void {
  let token = Token.load(event.address.toHexString())!;
  let apr = event.params.newBasketsNeeded.div(event.params.oldBasketsNeeded);
  updateTokenDayData(token, apr, event);
}

// * CalculateInsuranceRewards
export function calculateInsuranceRewards(event: Event): void {}

// * Issue and Redemption
// * Issuance
export function handleIssuanceStart(event: IssuanceStarted): void {
  let token = Token.load(event.address.toHexString())!;
  let user = getUser(event.params.issuer);

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(
    getEntryId(
      token.id,
      EntryType.Issuance,
      event.params.index.toI32().toString()
    )
  );
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = event.params.amount;
  entry.type = EntryType.Issuance;
  entry.status = EntryStatus.Pending;
  entry.draftId = event.params.index;
  entry.availableAt = event.params.blockAvailableAt;
  entry.save();
}

export function handleIssuance(event: IssuancesCompleted): void {
  updateEntriesStatus(
    event.params.firstId.toI32(),
    event.params.endId.toI32(),
    EntryType.Issuance,
    EntryStatus.Completed,
    event
  );
}

export function handleIssuanceCancel(event: IssuancesCanceled): void {
  updateEntriesStatus(
    event.params.firstId.toI32(),
    event.params.endId.toI32(),
    EntryType.Issuance,
    EntryStatus.Canceled,
    event
  );
}

// * Redemption
export function handleRedemption(event: Redemption): void {
  handleRTokenRedemption(
    event,
    event.address,
    event.params.redeemer,
    event.params.amount
  );
}

// Used for RSV as well
export function handleRTokenRedemption(
  event: ethereum.Event,
  address: Address,
  userAddress: Address,
  amount: BigInt,
  isRSV: boolean = false
): void {
  let user = getUser(userAddress);
  let mainAddress = "";
  let tokenAddress = "";

  if (isRSV) {
    let main = getMain(address);
    mainAddress = main.id;
    tokenAddress = main.token;
  } else {
    let token = Token.load(address.toHexString())!;
    tokenAddress = token.id;
    mainAddress = token.main!;
  }

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(
    getConcatenatedId("Redeem", event.transaction.hash.toHexString())
  );
  entry.createdAt = event.block.timestamp;
  entry.token = tokenAddress;
  entry.main = mainAddress;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = amount;
  entry.type = EntryType.Redemption;
  entry.status = EntryStatus.Completed;
  entry.save();
}

// * RToken Staking
// * Stake
export function handleStake(event: Staked): void {
  let user = getUser(event.params.staker);
  let token = Token.load(event.address.toHexString())!;
  let main = Main.load(token.main!)!;
  let mainUser = getMainUser(user.id, main.id);

  main.staked = main.staked.plus(event.params.rsrAmount);
  mainUser.staked = mainUser.staked.plus(event.params.rsrAmount);
  main.save();
  mainUser.save();

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(
    getConcatenatedId(EntryType.Stake, event.transaction.hash.toHexString())
  );
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = event.params.rsrAmount;
  entry.stAmount = event.params.stRSRAmount;
  entry.type = EntryType.Stake;
  entry.status = EntryStatus.Completed;
  entry.save();
}

// * UnStake
export function handleUnstakeStarted(event: UnstakingStarted): void {
  let user = getUser(event.params.staker);
  let token = Token.load(event.address.toHexString())!;
  let main = Main.load(token.main!)!;
  let mainUser = getMainUser(event.params.staker.toHexString(), main.id);
  let id = getEntryId(
    token.id,
    EntryType.Unstake,
    event.params.staker
      .toHexString()
      .concat("-")
      .concat(event.params.draftEra.toHexString())
      .concat("-")
      .concat(event.params.draftId.toI32().toString())
  );

  main.staked = main.staked.minus(event.params.rsrAmount);
  mainUser.staked = mainUser.staked.minus(event.params.rsrAmount);
  main.save();
  mainUser.save();

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(id);
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.draftId = event.params.draftId;
  entry.transaction = trx.id;
  entry.amount = event.params.rsrAmount;
  entry.stAmount = event.params.stRSRAmount;
  entry.type = EntryType.Unstake;
  entry.status = EntryStatus.Pending;
  entry.availableAt = event.params.availableAt;
  entry.save();
}

// TODO: Consider storing pending RSR to be withdrawn on UserMain relationship
export function handleUnstake(event: UnstakingCompleted): void {
  let token = getTokenInitial(event.address, TokenType.StakingToken);

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(trx.id);
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = event.params.staker.toHexString();
  entry.transaction = trx.id;
  entry.amount = event.params.rsrAmount;
  entry.type = EntryType.Withdraw;
  entry.status = EntryStatus.Completed;
  entry.save();

  // Mark previous pending unstake entries as complete
  let currentIndex = event.params.firstId.toI32();
  let endIndex = event.params.endId.toI32();

  for (let i = currentIndex; i < endIndex; i++) {
    let id = getEntryId(
      token.id,
      EntryType.Unstake,
      event.params.staker
        .toHexString()
        .concat("-")
        .concat(event.params.draftEra.toHexString())
        .concat("-")
        .concat(i.toString())
    );

    updateEntryStatus(id, EntryStatus.Completed, event);
  }
}

// * Handle Token Transfer (shared between stToken/RSR/RSV/RToken)
export function handleTransfer(event: TransferEvent): void {
  // Get User Addresses
  let fromUser = getUser(event.params.from);
  let toUser = getUser(event.params.to);

  // Get Token
  let token = getToken(event.address, event);

  // Update TokenUser records
  getTokenUser(token, fromUser, AddressType.From, event);
  getTokenUser(token, toUser, AddressType.To, event);

  let trx = getTransaction(event);
  let entryType = EntryType.Transfer;

  if (ADDRESS_ZERO == event.params.to) {
    entryType = EntryType.Burn;
  } else if (ADDRESS_ZERO == event.params.from) {
    entryType = EntryType.Mint;
  }

  // Create entry
  let entry = new Entry(event.transaction.hash.toHexString());
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  let mainId = token.main;
  if (mainId) {
    entry.main = mainId;
  }
  entry.user = fromUser.id;
  entry.transaction = trx.id;
  entry.amount = event.params.value;
  entry.type = entryType;
  entry.status = EntryStatus.Completed;
  entry.toAddr = toUser.id;
  entry.save();

  // Create or update Supply
  getSupply(entry, token, event.block.timestamp);
}

// * Handle Basket set (always happens on RToken creation)
export function handleBasketChange(event: BasketSet): void {
  let basketHandler = getBasketHandler(event.address.toHexString());
  let main = Main.load(basketHandler.main!)!;

  // Create basket entity, use the event hash as id
  let basket = getBasket(
    getConcatenatedId(main.token, event.transaction.hash.toHexString())
  );
  let facadeContract = Facade.bind(
    Address.fromString(main.facade!.toHexString())
  );
  let backingTokens = facadeContract.basketTokens();

  for (let i = 0; i < backingTokens.length; i++) {
    let token = getTokenInitial(backingTokens[i]);
    let collateral = new Collateral(getConcatenatedId(basket.id, token.id));
    collateral.basket = basket.id;
    collateral.token = token.id;
    collateral.index = i;
    collateral.save();
  }

  main.basket = basket.id;
  main.save();
}

// * RToken Deployment
export function handleCreateToken(event: RTokenCreated): void {
  // Create related tokens
  let rToken = getTokenInitial(event.params.rToken, TokenType.RToken);
  let stToken = getTokenInitial(event.params.stRSR, TokenType.StakingToken);

  getSupplyInitial(rToken.id);
  getSupplyInitial(stToken.id);

  let mainContract = MainContract.bind(event.params.main);
  let basketHandlerAddress = mainContract.basketHandler();
  let basketHandler = getBasketHandler(basketHandlerAddress.toHexString());

  // Create Main entity
  let main = new Main(event.params.main.toHexString());
  main.address = event.params.main;
  main.owner = event.params.owner;
  main.facade = event.params.facade;
  main.token = rToken.id;
  main.stToken = stToken.id;
  main.basketHandler = basketHandlerAddress;

  main.staked = BI_ZERO;
  main.save();

  // Main relationships
  basketHandler.main = main.id;
  rToken.main = main.id;
  stToken.main = main.id;
  rToken.save();
  stToken.save();
  basketHandler.save();

  // Initialize dynamic mappings for the new RToken system
  RTokenTemplate.create(event.params.rToken);
  stRSRTemplate.create(event.params.stRSR);
  BasketHandlerTemplate.create(basketHandlerAddress);
}

function updateEntryStatus(
  id: string,
  status: string,
  event?: ethereum.Event
): void {
  let entry = Entry.load(id)!;

  if (event) {
    let trx = getTransaction(event);
    entry.completionTxn = trx.id;
  }

  entry.updatedAt = event.block.timestamp;
  entry.status = status;
  entry.save();
}

function updateEntriesStatus(
  from: number,
  to: number,
  entryType: string,
  status: string,
  event: ethereum.Event
): void {
  for (let i = from; i < to; i++) {
    updateEntryStatus(
      getEntryId(event.address.toHexString(), entryType, i.toString()),
      status,
      event
    );
  }
}
