import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Collateral,
  Main,
  Supply,
  Token,
  TokenUser,
  Transaction,
  User,
  Vault,
} from "../generated/schema";
import {
  Main as MainTemplate,
  RToken as RTokenTemplate,
  stRSR as stRSRTemplate,
} from "../generated/templates";
import {
  IssuanceCanceled,
  IssuanceCompleted,
  IssuanceStarted,
  Redemption,
  Main as MainContract,
} from "../generated/templates/Main/Main";
import { Transfer as TransferEvent } from "../generated/templates/RToken/RToken";
import {
  Staked,
  UnstakingCompleted,
  UnstakingStarted,
} from "../generated/templates/stRSR/stRSR";
import { AssetManager } from "./../generated/Deployer/AssetManager";
import { RTokenCreated } from "./../generated/Deployer/Deployer";
import {
  Issuance as RSVIssuance,
  Redemption as RSVRedemption,
} from "./../generated/RSVManager/RSVManager";
import { Entry, MainUser } from "./../generated/schema";
import {
  AddressType,
  ADDRESS_ZERO,
  BI_ONE,
  BI_ZERO,
  EntryStatus,
  EntryType,
  getConcatenatedId,
  getTokenUserId,
  isRSV,
  isTokenUserExist,
  RSVInfo,
  TokenInfo,
  TokenType,
} from "./helper";

/**
 * Event handlers
 */

// Handle RToken deployment
export function handleCreateToken(event: RTokenCreated): void {
  let mainContract = MainContract.bind(event.params.main);
  // Create related tokens
  let rToken = getTokenInitial(event.params.rToken, TokenType.RToken);
  let stTokenAddress = mainContract.stRSR();
  let stToken = getTokenInitial(stTokenAddress, TokenType.StakingToken);

  getSupplyInitial(rToken.id);
  getSupplyInitial(stToken.id);

  // Create vault entity
  let vaultAddress = AssetManager.bind(mainContract.manager()).vault();
  let vault = getVault(vaultAddress);
  let backingTokens = mainContract.backingTokens();

  for (let i = 0; i < backingTokens.length; i++) {
    let token = getTokenInitial(backingTokens[i]);
    let collateral = new Collateral(getConcatenatedId(vault.id, token.id));
    collateral.vault = vault.id;
    collateral.token = token.id;
    collateral.index = i;
    collateral.save();
  }

  // Create Main entity
  let main = new Main(event.params.main.toHexString());
  main.address = event.params.main;
  main.owner = event.params.owner;
  main.token = rToken.id;
  main.stToken = stToken.id;
  main.vault = vault.id;
  main.staked = BI_ZERO;
  main.save();

  // Main relationships
  vault.main = main.id;
  rToken.main = main.id;
  stToken.main = main.id;
  rToken.save();
  stToken.save();
  vault.save();

  // Initialize dynamic mappings for the new RToken system
  RTokenTemplate.create(event.params.rToken);
  stRSRTemplate.create(stTokenAddress);
  MainTemplate.create(event.params.main);
}

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

export function handleTransferOldRSV(event: TransferEvent): void {
  event.address = Address.fromString(RSVInfo.address);
  handleTransfer(event);
}

function getTransaction(event: ethereum.Event): Transaction {
  let tx = Transaction.load(event.transaction.hash.toHexString());

  if (tx == null) {
    tx = new Transaction(event.transaction.hash.toHexString());
    tx.block = event.block.number;
    tx.timestamp = event.block.timestamp;
    tx.from = event.transaction.from;
    tx.to = event.transaction.to;
    tx.save();
  }

  return tx as Transaction;
}

export function handleIssuanceStart(event: IssuanceStarted): void {
  let main = getMain(event.address);
  let user = getUser(event.params.issuer);
  let token = Token.load(main.token)!;

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(getIssuanceId(event.params.issuanceId));
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

export function handleRSVIssuance(event: RSVIssuance): void {
  let main = getMain(Address.fromString(RSVInfo.main));
  let user = getUser(event.params.user);
  let token = Token.load(main.token)!;

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(
    getConcatenatedId("Issuance", event.transaction.hash.toHexString())
  );
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = event.params.amount;
  entry.type = EntryType.Issuance;
  entry.status = EntryStatus.Completed;
  entry.save();
}

function _handleRedemption(
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

export function handleRedemption(event: Redemption): void {
  _handleRedemption(
    event,
    event.address,
    event.params.redeemer,
    event.params.amount
  );
}

export function handleRSVRedemption(event: RSVRedemption): void {
  _handleRedemption(
    event,
    Address.fromString(RSVInfo.main),
    event.params.user,
    event.params.amount
  );
}

export function handleIssuance(event: IssuanceCompleted): void {
  updateEntryStatus(
    getIssuanceId(event.params.issuanceId),
    EntryStatus.Completed,
    event
  );
}

export function handleIssuanceCancel(event: IssuanceCanceled): void {
  updateEntryStatus(
    getIssuanceId(event.params.issuanceId),
    EntryStatus.Canceled,
    event
  );
}

function getIssuanceId(id: BigInt): string {
  return getConcatenatedId(EntryType.Issuance, id.toHexString());
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

export function handleStake(event: Staked): void {
  let user = getUser(event.params.staker);
  let token = Token.load(event.address.toHexString())!;
  let main = Main.load(token.main!)!;
  let mainUser = getMainUser(user.id, main.id);

  main.staked = main.staked.plus(event.params.amount);
  mainUser.staked = mainUser.staked.plus(event.params.amount);
  main.save();
  mainUser.save();

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(event.transaction.hash.toHexString());
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = event.params.amount;
  entry.type = EntryType.Stake;
  entry.status = EntryStatus.Completed;
  entry.save();
}

export function handleUnstakeStarted(event: UnstakingStarted): void {
  let id = getUnstakeId(event.params.withdrawalId);
  let user = getUser(event.params.staker);
  let token = Token.load(event.address.toHexString())!;

  // Create entry
  let trx = getTransaction(event);
  let entry = new Entry(id);
  entry.createdAt = event.block.timestamp;
  entry.token = token.id;
  entry.main = token.main!;
  entry.user = user.id;
  entry.transaction = trx.id;
  entry.amount = event.params.amount;
  entry.type = EntryType.Unstake;
  entry.status = EntryStatus.Pending;
  entry.availableAt = event.params.availableAt;
  entry.save();
}

export function handleUnstake(event: UnstakingCompleted): void {
  let id = getUnstakeId(event.params.withdrawalId);
  let token = getTokenInitial(event.address, TokenType.StakingToken);
  let main = Main.load(token.main!)!;
  let mainUser = getMainUser(event.params.staker.toHexString(), main.id);

  main.staked = main.staked.minus(event.params.amount);
  mainUser.staked = mainUser.staked.minus(event.params.amount);
  main.save();
  mainUser.save();
  updateEntryStatus(id, EntryStatus.Completed, event);
}

function getUnstakeId(id: BigInt): string {
  return getConcatenatedId(EntryType.Unstake, id.toHexString());
}

/**
 * Entity getters
 */
export function getUser(address: Address): User {
  let user = User.load(address.toHexString());
  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
    user.save();
  }
  return user as User;
}

export function getMain(address: Address): Main {
  let main = Main.load(address.toHexString());

  if (main == null && isRSV(address)) {
    getTokenInitial(Address.fromString(RSVInfo.address));
    main = Main.load(RSVInfo.main);
  }

  return main as Main;
}

export function getVault(address: Address): Vault {
  let vault = Vault.load(address.toHexString());
  if (vault == null) {
    vault = new Vault(address.toHexString());
    vault.address = address;
    vault.save();
  }
  return vault as Vault;
}

function getSupply(entry: Entry, token: Token, timestamp: BigInt): Supply {
  let supply = getSupplyInitial(token.address.toHexString());

  if (entry.type == EntryType.Mint) {
    supply.minted = supply.minted.plus(entry.amount);
    supply.total = supply.total.plus(entry.amount);
  } else if (entry.type == EntryType.Burn) {
    supply.burned = supply.burned.plus(entry.amount);
    supply.total = supply.total.minus(entry.amount);
  }
  supply.changedTimestamp =
    entry.type == EntryType.Mint || entry.type == EntryType.Burn
      ? timestamp
      : null;

  supply.save();

  return supply as Supply;
}

function getSupplyInitial(tokenAddress: string): Supply {
  let supply = Supply.load(tokenAddress);
  if (supply == null) {
    supply = new Supply(tokenAddress);
    supply.token = tokenAddress;
    supply.total = BI_ZERO;
    supply.minted = BI_ZERO;
    supply.burned = BI_ZERO;

    supply.save();
  }

  return supply as Supply;
}

function getMainUser(user: string, main: string): MainUser {
  let mainUser = MainUser.load(getConcatenatedId(main, user));

  if (mainUser == null) {
    let fromUser = (mainUser = new MainUser(getConcatenatedId(main, user)));
    mainUser.main = main;
    mainUser.user = user;
    mainUser.staked = BI_ZERO;
    mainUser.rewarded = BI_ZERO;
    mainUser.save();
  }

  return mainUser as MainUser;
}

function getTokenUser(
  token: Token,
  user: User,
  addrType: string,
  event: TransferEvent
): TokenUser {
  let tokenUser = getTokenUserInitial(token, user);
  tokenUser.transferCount = tokenUser.transferCount.plus(BI_ONE);
  tokenUser.lastTransferTimestamp = event.block.timestamp;

  if (addrType == AddressType.From) {
    tokenUser.outTransferCount = tokenUser.outTransferCount.plus(BI_ONE);
    tokenUser.totalOutcome = tokenUser.totalOutcome.plus(event.params.value);
    tokenUser.balance = tokenUser.balance.minus(event.params.value);
  } else if (addrType == AddressType.To) {
    tokenUser.inTransferCount = tokenUser.inTransferCount.plus(BI_ONE);
    tokenUser.totalIncome = tokenUser.totalIncome.plus(event.params.value);
    tokenUser.balance = tokenUser.balance.plus(event.params.value);
  }

  tokenUser.save();

  return tokenUser as TokenUser;
}

function getTokenUserInitial(token: Token, user: User): TokenUser {
  let tokenUserId = getTokenUserId(token.id, user.address);
  let tokenUser = TokenUser.load(tokenUserId);
  if (tokenUser == null) {
    tokenUser = new TokenUser(tokenUserId);
    tokenUser.token = token.id;
    tokenUser.user = user.id;
    tokenUser.transferCount = BI_ZERO;
    tokenUser.inTransferCount = BI_ZERO;
    tokenUser.outTransferCount = BI_ZERO;
    tokenUser.balance = BI_ZERO;
    tokenUser.totalIncome = BI_ZERO;
    tokenUser.totalOutcome = BI_ZERO;
    tokenUser.save();
  }

  return tokenUser as TokenUser;
}

function getToken(address: Address, event: TransferEvent): Token {
  let token = getTokenInitial(address);
  token.transfersCount = token.transfersCount.plus(BI_ONE);

  if (event.params.from != ADDRESS_ZERO) {
    token.holdersCount = token.holdersCount.plus(
      getNewHolderNumber(token.id, event.params.from, event.params.value.neg())
    );
  }
  if (event.params.to != ADDRESS_ZERO && event.params.to != event.params.from) {
    token.holdersCount = token.holdersCount.plus(
      getNewHolderNumber(token.id, event.params.to, event.params.value)
    );
  }
  token.save();

  return token as Token;
}

function getTokenInitial(
  address: Address,
  type: string = TokenType.ERC20
): Token {
  let token = Token.load(address.toHexString());

  if (token == null) {
    let tokenInfo = TokenInfo.build(address);
    token = new Token(address.toHexString());
    token.address = address;
    token.name = tokenInfo.name;
    token.symbol = tokenInfo.symbol;
    token.decimals = tokenInfo.decimals;
    token.transfersCount = BI_ZERO;
    token.holdersCount = BI_ZERO;
    token.type = type;
    token.save();

    // hardcoded RSV info
    if (isRSV(address)) {
      createRSV(token);
    }
  }

  return token as Token;
}

// Gets an ERC20 Token and convert it to an RToken
// NOTE: RSV is the only case
function createRSV(token: Token): void {
  // Create RSV Collaterals mappings from Vault
  let vault = getVault(Address.fromString(RSVInfo.vaultId));

  for (let i = 0; i < RSVInfo.collaterals.length; i++) {
    let token = getTokenInitial(Address.fromString(RSVInfo.collaterals[i]));
    let collateral = new Collateral(getConcatenatedId(vault.id, token.id));
    collateral.vault = vault.id;
    collateral.token = token.id;
    collateral.index = i;
    collateral.save();
  }

  // Create Main entity
  let main = new Main(RSVInfo.main);
  main.address = Address.fromString(RSVInfo.main);
  main.owner = Address.fromString(RSVInfo.owner);
  main.token = token.id;
  main.vault = vault.id;
  main.staked = BI_ZERO;
  main.save();

  // Update token
  token.type = TokenType.RToken;
  token.main = main.id;
  token.save();
}

function getNewHolderNumber(
  tokenAddress: string,
  userAddr: Address,
  amount: BigInt
): BigInt {
  let newHoldersNumber = BI_ZERO;

  let tokenUser = TokenUser.load(getTokenUserId(tokenAddress, userAddr));
  let newBalance = BI_ZERO;
  if (isTokenUserExist(tokenUser) && tokenUser) {
    newBalance = tokenUser.balance;
  }
  newBalance = newBalance.plus(amount);

  if (isTokenUserExist(tokenUser) && newBalance.le(BI_ZERO)) {
    newHoldersNumber = newHoldersNumber.minus(BI_ONE);
  } else if (!isTokenUserExist(tokenUser) && newBalance.gt(BI_ZERO)) {
    newHoldersNumber = newHoldersNumber.plus(BI_ONE);
  }

  return newHoldersNumber as BigInt;
}
