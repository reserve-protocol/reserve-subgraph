// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class User extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save User entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save User entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("User", id.toString(), this);
  }

  static load(id: string): User | null {
    return store.get("User", id) as User | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get address(): Bytes {
    let value = this.get("address");
    return value.toBytes();
  }

  set address(value: Bytes) {
    this.set("address", Value.fromBytes(value));
  }

  get tokens(): Array<string> {
    let value = this.get("tokens");
    return value.toStringArray();
  }

  set tokens(value: Array<string>) {
    this.set("tokens", Value.fromStringArray(value));
  }

  get outTransactions(): Array<string | null> {
    let value = this.get("outTransactions");
    return value.toStringArray();
  }

  set outTransactions(value: Array<string | null>) {
    this.set("outTransactions", Value.fromStringArray(value));
  }

  get inTransactions(): Array<string | null> {
    let value = this.get("inTransactions");
    return value.toStringArray();
  }

  set inTransactions(value: Array<string | null>) {
    this.set("inTransactions", Value.fromStringArray(value));
  }
}

export class Token extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Token entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Token entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Token", id.toString(), this);
  }

  static load(id: string): Token | null {
    return store.get("Token", id) as Token | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get symbol(): string {
    let value = this.get("symbol");
    return value.toString();
  }

  set symbol(value: string) {
    this.set("symbol", Value.fromString(value));
  }

  get name(): string | null {
    let value = this.get("name");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set name(value: string | null) {
    if (value === null) {
      this.unset("name");
    } else {
      this.set("name", Value.fromString(value as string));
    }
  }

  get address(): string | null {
    let value = this.get("address");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set address(value: string | null) {
    if (value === null) {
      this.unset("address");
    } else {
      this.set("address", Value.fromString(value as string));
    }
  }

  get transfersCount(): BigInt {
    let value = this.get("transfersCount");
    return value.toBigInt();
  }

  set transfersCount(value: BigInt) {
    this.set("transfersCount", Value.fromBigInt(value));
  }

  get holdersCount(): BigInt {
    let value = this.get("holdersCount");
    return value.toBigInt();
  }

  set holdersCount(value: BigInt) {
    this.set("holdersCount", Value.fromBigInt(value));
  }

  get users(): Array<string> {
    let value = this.get("users");
    return value.toStringArray();
  }

  set users(value: Array<string>) {
    this.set("users", Value.fromStringArray(value));
  }

  get supply(): string {
    let value = this.get("supply");
    return value.toString();
  }

  set supply(value: string) {
    this.set("supply", Value.fromString(value));
  }

  get transactions(): Array<string | null> {
    let value = this.get("transactions");
    return value.toStringArray();
  }

  set transactions(value: Array<string | null>) {
    this.set("transactions", Value.fromStringArray(value));
  }
}

export class TokenUser extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save TokenUser entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save TokenUser entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("TokenUser", id.toString(), this);
  }

  static load(id: string): TokenUser | null {
    return store.get("TokenUser", id) as TokenUser | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get user(): string {
    let value = this.get("user");
    return value.toString();
  }

  set user(value: string) {
    this.set("user", Value.fromString(value));
  }

  get lastTransferTimestamp(): BigInt | null {
    let value = this.get("lastTransferTimestamp");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set lastTransferTimestamp(value: BigInt | null) {
    if (value === null) {
      this.unset("lastTransferTimestamp");
    } else {
      this.set("lastTransferTimestamp", Value.fromBigInt(value as BigInt));
    }
  }

  get transferCount(): BigInt {
    let value = this.get("transferCount");
    return value.toBigInt();
  }

  set transferCount(value: BigInt) {
    this.set("transferCount", Value.fromBigInt(value));
  }

  get inTransferCount(): BigInt {
    let value = this.get("inTransferCount");
    return value.toBigInt();
  }

  set inTransferCount(value: BigInt) {
    this.set("inTransferCount", Value.fromBigInt(value));
  }

  get outTransferCount(): BigInt {
    let value = this.get("outTransferCount");
    return value.toBigInt();
  }

  set outTransferCount(value: BigInt) {
    this.set("outTransferCount", Value.fromBigInt(value));
  }

  get balance(): BigInt {
    let value = this.get("balance");
    return value.toBigInt();
  }

  set balance(value: BigInt) {
    this.set("balance", Value.fromBigInt(value));
  }

  get totalIncome(): BigInt {
    let value = this.get("totalIncome");
    return value.toBigInt();
  }

  set totalIncome(value: BigInt) {
    this.set("totalIncome", Value.fromBigInt(value));
  }

  get totalOutcome(): BigInt {
    let value = this.get("totalOutcome");
    return value.toBigInt();
  }

  set totalOutcome(value: BigInt) {
    this.set("totalOutcome", Value.fromBigInt(value));
  }
}

export class Supply extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Supply entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Supply entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Supply", id.toString(), this);
  }

  static load(id: string): Supply | null {
    return store.get("Supply", id) as Supply | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get changedTimestamp(): BigInt | null {
    let value = this.get("changedTimestamp");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set changedTimestamp(value: BigInt | null) {
    if (value === null) {
      this.unset("changedTimestamp");
    } else {
      this.set("changedTimestamp", Value.fromBigInt(value as BigInt));
    }
  }

  get minted(): BigInt {
    let value = this.get("minted");
    return value.toBigInt();
  }

  set minted(value: BigInt) {
    this.set("minted", Value.fromBigInt(value));
  }

  get burned(): BigInt {
    let value = this.get("burned");
    return value.toBigInt();
  }

  set burned(value: BigInt) {
    this.set("burned", Value.fromBigInt(value));
  }

  get total(): BigInt {
    let value = this.get("total");
    return value.toBigInt();
  }

  set total(value: BigInt) {
    this.set("total", Value.fromBigInt(value));
  }
}

export class Transaction extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Transaction entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Transaction entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Transaction", id.toString(), this);
  }

  static load(id: string): Transaction | null {
    return store.get("Transaction", id) as Transaction | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get block(): BigInt {
    let value = this.get("block");
    return value.toBigInt();
  }

  set block(value: BigInt) {
    this.set("block", Value.fromBigInt(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get transactionType(): string {
    let value = this.get("transactionType");
    return value.toString();
  }

  set transactionType(value: string) {
    this.set("transactionType", Value.fromString(value));
  }

  get fromAddr(): string {
    let value = this.get("fromAddr");
    return value.toString();
  }

  set fromAddr(value: string) {
    this.set("fromAddr", Value.fromString(value));
  }

  get toAddr(): string {
    let value = this.get("toAddr");
    return value.toString();
  }

  set toAddr(value: string) {
    this.set("toAddr", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get amount(): BigInt {
    let value = this.get("amount");
    return value.toBigInt();
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }
}
