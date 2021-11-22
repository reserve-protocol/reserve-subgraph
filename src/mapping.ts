import { Main as MainContract, IssuanceStarted } from './../generated/templates/Main/Main';
import { RTokenCreated } from "./../generated/Deployer/Deployer";
import {
  Supply,
  Token,
  TokenUser,
  Transaction,
  User,
  Main,
} from "../generated/schema";
import { RToken as RTokenTemplate, Main as MainTemplate } from "../generated/templates";
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  ADDRESS_ZERO,
  AddressType,
  BI_ONE,
  BI_ZERO,
  TokenInfo,
  TransactionType,
} from "./helper";
import {
  RToken,
  Transfer as TransferEvent,
} from "../generated/templates/RToken/RToken";

export function getUser(address: Address): User {
  let user = User.load(address.toHexString());
  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
    user.save();
  }
  return user as User;
}

export function getMain(address: Address, owner: Address): Main {
  let main = Main.load(address.toHexString());
  if (main == null) {
    main = new Main(address.toHexString())
    main.address = address.toHexString();
    main.rsr = getTokenInitial(contract.rsr())
    main.stToken = contract.stRSR().toHexString()
    main.owner = owner.toHexString()
  } 
  return main as Main;
}

export function handleCreateToken(event: RTokenCreated): void {
  let contract = MainContract.bind(event.params.main)
  let main = getMain(event.params.main, event.params.owner);
  let rToken = getTokenInitial(event.params.rToken);
  let rsr = getTokenInitial(contract.rsr());
  let stToken = getTokenInitial(contract.stRSR());

  // update rToken and stToken main
  rToken.main = main.id;
  rToken.save();
  stToken.main = main.id;
  stToken.save();

  main.rToken = rToken.id;
  main.stToken = stToken.id;
  main.rsr = rsr.id;
  
  main.save();

  RTokenTemplate.create(event.params.rToken);
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

  // Create Transaction
  let trx = getTransaction(event, token, fromUser, toUser);

  // Create or update Supply
  getSupply(trx, token);
}

export function handleIssuance(event: IssuanceStarted): void {

}

function getTransaction(
  event: TransferEvent,
  token: Token,
  fromUser: User,
  toUser: User
): Transaction {
  let trx = new Transaction(event.transaction.hash.toHex());
  trx.block = event.block.number;
  trx.timestamp = event.block.timestamp;
  trx.amount = event.params.value;
  trx.fromAddr = fromUser.id;
  trx.toAddr = toUser.id;
  trx.token = token.id;

  if (ADDRESS_ZERO == event.params.to) {
    trx.transactionType = TransactionType.Burn;
  } else if (ADDRESS_ZERO == event.params.from) {
    trx.transactionType = TransactionType.Mint;
  } else {
    trx.transactionType = TransactionType.Transfer;
  }

  trx.save();

  return trx as Transaction;
}

function getSupply(trx: Transaction, token: Token): Supply {
  let supply = getSupplyInitial(token.id);

  if (trx.transactionType == TransactionType.Mint) {
    supply.minted = supply.minted.plus(trx.amount);
    supply.total = supply.total.plus(trx.amount);
  } else if (trx.transactionType == TransactionType.Burn) {
    supply.burned = supply.burned.plus(trx.amount);
    supply.total = supply.total.minus(trx.amount);
  }
  supply.changedTimestamp =
    trx.transactionType == TransactionType.Mint ||
    trx.transactionType == TransactionType.Burn
      ? trx.timestamp
      : null;

  supply.save();

  return supply as Supply;
}

function getSupplyInitial(tokenSymbol: string): Supply {
  let supply = Supply.load(tokenSymbol);
  if (supply == null) {
    supply = new Supply(tokenSymbol);
    supply.token = tokenSymbol;
    supply.total = BI_ZERO;
    supply.minted = BI_ZERO;
    supply.burned = BI_ZERO;

    supply.save();
  }

  return supply as Supply;
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

function getTokenInitial(address: Address): Token {
  let token = Token.load(address.toHexString());
  if (token == null) {
    let tokenInfo = TokenInfo.build(address)
    token = new Token(address.toHexString());
    token.name = tokenInfo.name;
    token.symbol = tokenInfo.symbol;
    token.address = tokenInfo.address;
    token.transfersCount = BI_ZERO;
    token.holdersCount = BI_ZERO;
    token.save();
  }

  return token as Token;
}

function getNewHolderNumber(
  tokenSymbol: string,
  userAddr: Address,
  amount: BigInt
): BigInt {
  let newHoldersNumber = BI_ZERO;

  let tokenUser = TokenUser.load(getTokenUserId(tokenSymbol, userAddr));
  let newBalance = isTokenUserExist(tokenUser) ? tokenUser.balance : BI_ZERO;
  newBalance = newBalance.plus(amount);

  if (isTokenUserExist(tokenUser) && newBalance.le(BI_ZERO)) {
    newHoldersNumber = newHoldersNumber.minus(BI_ONE);
  } else if (!isTokenUserExist(tokenUser) && newBalance.gt(BI_ZERO)) {
    newHoldersNumber = newHoldersNumber.plus(BI_ONE);
  }

  return newHoldersNumber as BigInt;
}

function getTokenUserId(tokenSymbol: string, userAddr: Bytes): string {
  return tokenSymbol.concat("-").concat(userAddr.toHexString());
}

function isTokenUserExist(tokenUser: TokenUser | null): boolean {
  return tokenUser != null;
}
