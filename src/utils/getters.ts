import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Basket,
  Collateral,
  Main,
  Supply,
  Token,
  TokenUser,
  Transaction,
  User,
} from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/templates/RToken/RToken";
import { Entry, MainUser } from "./../../generated/schema";
import {
  AddressType,
  ADDRESS_ZERO,
  BI_ONE,
  BI_ZERO,
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
 * * Entity getters
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

export function getBasket(id: string): Basket {
  let basket = Basket.load(id);
  if (basket == null) {
    basket = new Basket(id);
    basket.save();
  }
  return basket as Basket;
}

export function getSupply(
  entry: Entry,
  token: Token,
  timestamp: BigInt
): Supply {
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

export function getSupplyInitial(tokenAddress: string): Supply {
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

export function getMainUser(user: string, main: string): MainUser {
  let mainUser = MainUser.load(getConcatenatedId(main, user));

  if (mainUser == null) {
    mainUser = new MainUser(getConcatenatedId(main, user));
    mainUser.main = main;
    mainUser.user = user;
    mainUser.staked = BI_ZERO;
    mainUser.rewarded = BI_ZERO;
    mainUser.save();
  }

  return mainUser as MainUser;
}

export function getTokenUser(
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

export function getTokenUserInitial(token: Token, user: User): TokenUser {
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

export function getToken(address: Address, event: TransferEvent): Token {
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

export function getTokenInitial(
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

export function getTransaction(event: ethereum.Event): Transaction {
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

export function getNewHolderNumber(
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

// Gets an ERC20 Token and convert it to an RToken
// NOTE: RSV is the only case
function createRSV(token: Token): void {
  // Create RSV Collaterals mappings from Vault
  let vault = getBasket(RSVInfo.vaultId);

  for (let i = 0; i < RSVInfo.collaterals.length; i++) {
    let token = getTokenInitial(Address.fromString(RSVInfo.collaterals[i]));
    let collateral = new Collateral(getConcatenatedId(vault.id, token.id));
    collateral.basket = vault.id;
    collateral.token = token.id;
    collateral.index = i;
    collateral.save();
  }

  // Create Main entity
  let main = new Main(RSVInfo.main);
  main.address = Address.fromString(RSVInfo.main);
  main.owner = Address.fromString(RSVInfo.owner);
  main.token = token.id;
  main.basket = vault.id;
  main.staked = BI_ZERO;
  main.save();

  // Update token
  token.type = TokenType.RToken;
  token.main = main.id;
  token.save();
}
