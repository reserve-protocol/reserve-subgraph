import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Collateral, Main, Token } from "../generated/schema";
import {
  RToken as RTokenTemplate,
  stRSR as stRSRTemplate,
} from "../generated/templates";
import {
  IssuancesCanceled,
  IssuancesCompleted,
  IssuanceStarted,
  Redemption,
  Transfer as TransferEvent,
} from "../generated/templates/RToken/RToken";
import {
  Staked,
  UnstakingCompleted,
  UnstakingStarted,
} from "../generated/templates/stRSR/stRSR";
import { RTokenCreated } from "./../generated/Deployer/Deployer";
import { Facade } from "./../generated/Deployer/Facade";
import { Entry } from "./../generated/schema";
import {
  getBasket,
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

/**
 * * Event handlers
 */

// * Issue and Redemption
// * Issuance
export function handleIssuanceStart(event: IssuanceStarted): void {
  let main = getMain(event.address);
  let user = getUser(event.params.issuer);
  let token = Token.load(main.token)!;

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(
    getEntryId(token.id, EntryType.Issuance, event.params.index.toString())
  );
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = event.params.amount;
  entry.type = EntryType.Issuance;
  entry.status = EntryStatus.Pending;
  entry.availableAt = event.params.blockAvailableAt;
  entry.save();
}

export function handleIssuance(event: IssuancesCompleted): void {
  updateEntriesStatus(
    event.params.firstId,
    event.params.endId,
    EntryType.Issuance,
    EntryStatus.Completed,
    event
  );
}

export function handleIssuanceCancel(event: IssuancesCanceled): void {
  updateEntriesStatus(
    event.params.firstId,
    event.params.endId,
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
  mainAddress: Address,
  userAddress: Address,
  amount: BigInt
): void {
  let main = getMain(mainAddress);
  let user = getUser(userAddress);
  let token = Token.load(main.token)!;

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(
    getConcatenatedId("Redeem", event.transaction.hash.toHexString())
  );
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
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
  let id = getEntryId(
    token.id,
    EntryType.Unstake,
    event.params.staker
      .toHexString()
      .concat("-")
      .concat(event.params.draftEra.toHexString())
      .concat("-")
      .concat(event.params.draftId.toHexString())
  );

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(id);
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = event.params.rsrAmount;
  entry.stAmount = event.params.stRSRAmount;
  entry.type = EntryType.Unstake;
  entry.status = EntryStatus.Pending;
  entry.availableAt = event.params.availableAt;
  entry.save();
}

export function handleUnstake(event: UnstakingCompleted): void {
  let token = getTokenInitial(event.address, TokenType.StakingToken);
  let main = Main.load(token.main!)!;
  let mainUser = getMainUser(event.params.staker.toHexString(), main.id);

  main.staked = main.staked.minus(event.params.rsrAmount);
  mainUser.staked = mainUser.staked.minus(event.params.rsrAmount);
  main.save();
  mainUser.save();

  let currentIndex = event.params.firstId;

  do {
    let id = getEntryId(
      token.id,
      EntryType.Unstake,
      event.params.staker
        .toHexString()
        .concat("-")
        .concat(event.params.draftEra.toHexString())
        .concat("-")
        .concat(currentIndex.toHexString())
    );

    updateEntryStatus(id, EntryStatus.Completed, event);
    currentIndex.plus(BI_ONE);
  } while (!currentIndex.equals(event.params.endId));
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

// * RToken Deployment
export function handleCreateToken(event: RTokenCreated): void {
  // Create related tokens
  let rToken = getTokenInitial(event.params.rToken, TokenType.RToken);
  let stToken = getTokenInitial(event.params.stRSR, TokenType.StakingToken);

  getSupplyInitial(rToken.id);
  getSupplyInitial(stToken.id);

  // Create basket entity, use the event hash as id
  let basket = getBasket(
    getConcatenatedId(rToken.id, event.transaction.hash.toHexString())
  );
  let backingTokens = Facade.backingTokens();

  for (let i = 0; i < backingTokens.length; i++) {
    let token = getTokenInitial(backingTokens[i]);
    let collateral = new Collateral(getConcatenatedId(basket.id, token.id));
    collateral.basket = basket.id;
    collateral.token = token.id;
    collateral.index = i;
    collateral.save();
  }

  // Create Main entity
  let main = new Main(event.params.main.toHexString());
  main.address = event.params.main;
  main.owner = event.params.owner;
  main.facade = event.params.facade;
  main.token = rToken.id;
  main.stToken = stToken.id;
  main.basket = basket.id;
  main.staked = BI_ZERO;
  main.save();

  // Main relationships
  basket.main = main.id;
  rToken.main = main.id;
  stToken.main = main.id;
  rToken.save();
  stToken.save();
  basket.save();

  // Initialize dynamic mappings for the new RToken system
  RTokenTemplate.create(event.params.rToken);
  stRSRTemplate.create(event.params.stRSR);
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
  from: BigInt,
  to: BigInt,
  entryType: string,
  status: string,
  event: ethereum.Event
): void {
  let currentId = from;

  do {
    updateEntryStatus(
      getEntryId(
        event.address.toHexString(),
        entryType,
        currentId.toHexString()
      ),
      status,
      event
    );
    currentId.plus(BI_ONE);
  } while (!currentId.equals(to));
}
