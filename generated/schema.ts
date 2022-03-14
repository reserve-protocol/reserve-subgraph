// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class User extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("address", Value.fromBytes(Bytes.empty()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save User entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save User entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("User", id.toString(), this);
    }
  }

  static load(id: string): User | null {
    return changetype<User | null>(store.get("User", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get address(): Bytes {
    let value = this.get("address");
    return value!.toBytes();
  }

  set address(value: Bytes) {
    this.set("address", Value.fromBytes(value));
  }

  get tokens(): Array<string> {
    let value = this.get("tokens");
    return value!.toStringArray();
  }

  set tokens(value: Array<string>) {
    this.set("tokens", Value.fromStringArray(value));
  }

  get mains(): Array<string> {
    let value = this.get("mains");
    return value!.toStringArray();
  }

  set mains(value: Array<string>) {
    this.set("mains", Value.fromStringArray(value));
  }

  get records(): Array<string> {
    let value = this.get("records");
    return value!.toStringArray();
  }

  set records(value: Array<string>) {
    this.set("records", Value.fromStringArray(value));
  }
}

export class Main extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("address", Value.fromBytes(Bytes.empty()));
    this.set("owner", Value.fromBytes(Bytes.empty()));
    this.set("token", Value.fromString(""));
    this.set("basket", Value.fromString(""));
    this.set("staked", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Main entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Main entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Main", id.toString(), this);
    }
  }

  static load(id: string): Main | null {
    return changetype<Main | null>(store.get("Main", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get address(): Bytes {
    let value = this.get("address");
    return value!.toBytes();
  }

  set address(value: Bytes) {
    this.set("address", Value.fromBytes(value));
  }

  get facade(): Bytes | null {
    let value = this.get("facade");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set facade(value: Bytes | null) {
    if (!value) {
      this.unset("facade");
    } else {
      this.set("facade", Value.fromBytes(<Bytes>value));
    }
  }

  get owner(): Bytes {
    let value = this.get("owner");
    return value!.toBytes();
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get token(): string {
    let value = this.get("token");
    return value!.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get basket(): string {
    let value = this.get("basket");
    return value!.toString();
  }

  set basket(value: string) {
    this.set("basket", Value.fromString(value));
  }

  get staked(): BigInt {
    let value = this.get("staked");
    return value!.toBigInt();
  }

  set staked(value: BigInt) {
    this.set("staked", Value.fromBigInt(value));
  }

  get stToken(): string | null {
    let value = this.get("stToken");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set stToken(value: string | null) {
    if (!value) {
      this.unset("stToken");
    } else {
      this.set("stToken", Value.fromString(<string>value));
    }
  }
}

export class MainUser extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("main", Value.fromString(""));
    this.set("user", Value.fromString(""));
    this.set("staked", Value.fromBigInt(BigInt.zero()));
    this.set("rewarded", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save MainUser entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save MainUser entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("MainUser", id.toString(), this);
    }
  }

  static load(id: string): MainUser | null {
    return changetype<MainUser | null>(store.get("MainUser", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get main(): string {
    let value = this.get("main");
    return value!.toString();
  }

  set main(value: string) {
    this.set("main", Value.fromString(value));
  }

  get user(): string {
    let value = this.get("user");
    return value!.toString();
  }

  set user(value: string) {
    this.set("user", Value.fromString(value));
  }

  get staked(): BigInt {
    let value = this.get("staked");
    return value!.toBigInt();
  }

  set staked(value: BigInt) {
    this.set("staked", Value.fromBigInt(value));
  }

  get rewarded(): BigInt {
    let value = this.get("rewarded");
    return value!.toBigInt();
  }

  set rewarded(value: BigInt) {
    this.set("rewarded", Value.fromBigInt(value));
  }
}

export class Collateral extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("basket", Value.fromString(""));
    this.set("token", Value.fromString(""));
    this.set("index", Value.fromI32(0));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Collateral entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Collateral entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Collateral", id.toString(), this);
    }
  }

  static load(id: string): Collateral | null {
    return changetype<Collateral | null>(store.get("Collateral", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get basket(): string {
    let value = this.get("basket");
    return value!.toString();
  }

  set basket(value: string) {
    this.set("basket", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value!.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get index(): i32 {
    let value = this.get("index");
    return value!.toI32();
  }

  set index(value: i32) {
    this.set("index", Value.fromI32(value));
  }
}

export class Basket extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Basket entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Basket entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Basket", id.toString(), this);
    }
  }

  static load(id: string): Basket | null {
    return changetype<Basket | null>(store.get("Basket", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get main(): string | null {
    let value = this.get("main");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set main(value: string | null) {
    if (!value) {
      this.unset("main");
    } else {
      this.set("main", Value.fromString(<string>value));
    }
  }

  get collaterals(): Array<string> | null {
    let value = this.get("collaterals");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set collaterals(value: Array<string> | null) {
    if (!value) {
      this.unset("collaterals");
    } else {
      this.set("collaterals", Value.fromStringArray(<Array<string>>value));
    }
  }
}

export class Token extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("address", Value.fromBytes(Bytes.empty()));
    this.set("name", Value.fromString(""));
    this.set("symbol", Value.fromString(""));
    this.set("decimals", Value.fromI32(0));
    this.set("transfersCount", Value.fromBigInt(BigInt.zero()));
    this.set("holdersCount", Value.fromBigInt(BigInt.zero()));
    this.set("type", Value.fromString(""));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Token entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Token entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Token", id.toString(), this);
    }
  }

  static load(id: string): Token | null {
    return changetype<Token | null>(store.get("Token", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get address(): Bytes {
    let value = this.get("address");
    return value!.toBytes();
  }

  set address(value: Bytes) {
    this.set("address", Value.fromBytes(value));
  }

  get name(): string {
    let value = this.get("name");
    return value!.toString();
  }

  set name(value: string) {
    this.set("name", Value.fromString(value));
  }

  get symbol(): string {
    let value = this.get("symbol");
    return value!.toString();
  }

  set symbol(value: string) {
    this.set("symbol", Value.fromString(value));
  }

  get decimals(): i32 {
    let value = this.get("decimals");
    return value!.toI32();
  }

  set decimals(value: i32) {
    this.set("decimals", Value.fromI32(value));
  }

  get transfersCount(): BigInt {
    let value = this.get("transfersCount");
    return value!.toBigInt();
  }

  set transfersCount(value: BigInt) {
    this.set("transfersCount", Value.fromBigInt(value));
  }

  get holdersCount(): BigInt {
    let value = this.get("holdersCount");
    return value!.toBigInt();
  }

  set holdersCount(value: BigInt) {
    this.set("holdersCount", Value.fromBigInt(value));
  }

  get type(): string {
    let value = this.get("type");
    return value!.toString();
  }

  set type(value: string) {
    this.set("type", Value.fromString(value));
  }

  get main(): string | null {
    let value = this.get("main");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set main(value: string | null) {
    if (!value) {
      this.unset("main");
    } else {
      this.set("main", Value.fromString(<string>value));
    }
  }

  get apy(): i32 {
    let value = this.get("apy");
    return value!.toI32();
  }

  set apy(value: i32) {
    this.set("apy", Value.fromI32(value));
  }

  get users(): Array<string> {
    let value = this.get("users");
    return value!.toStringArray();
  }

  set users(value: Array<string>) {
    this.set("users", Value.fromStringArray(value));
  }

  get supply(): string | null {
    let value = this.get("supply");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set supply(value: string | null) {
    if (!value) {
      this.unset("supply");
    } else {
      this.set("supply", Value.fromString(<string>value));
    }
  }

  get records(): Array<string> {
    let value = this.get("records");
    return value!.toStringArray();
  }

  set records(value: Array<string>) {
    this.set("records", Value.fromStringArray(value));
  }
}

export class TokenUser extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("token", Value.fromString(""));
    this.set("user", Value.fromString(""));
    this.set("transferCount", Value.fromBigInt(BigInt.zero()));
    this.set("inTransferCount", Value.fromBigInt(BigInt.zero()));
    this.set("outTransferCount", Value.fromBigInt(BigInt.zero()));
    this.set("balance", Value.fromBigInt(BigInt.zero()));
    this.set("totalIncome", Value.fromBigInt(BigInt.zero()));
    this.set("totalOutcome", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save TokenUser entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save TokenUser entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("TokenUser", id.toString(), this);
    }
  }

  static load(id: string): TokenUser | null {
    return changetype<TokenUser | null>(store.get("TokenUser", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value!.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get user(): string {
    let value = this.get("user");
    return value!.toString();
  }

  set user(value: string) {
    this.set("user", Value.fromString(value));
  }

  get lastTransferTimestamp(): BigInt | null {
    let value = this.get("lastTransferTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set lastTransferTimestamp(value: BigInt | null) {
    if (!value) {
      this.unset("lastTransferTimestamp");
    } else {
      this.set("lastTransferTimestamp", Value.fromBigInt(<BigInt>value));
    }
  }

  get transferCount(): BigInt {
    let value = this.get("transferCount");
    return value!.toBigInt();
  }

  set transferCount(value: BigInt) {
    this.set("transferCount", Value.fromBigInt(value));
  }

  get inTransferCount(): BigInt {
    let value = this.get("inTransferCount");
    return value!.toBigInt();
  }

  set inTransferCount(value: BigInt) {
    this.set("inTransferCount", Value.fromBigInt(value));
  }

  get outTransferCount(): BigInt {
    let value = this.get("outTransferCount");
    return value!.toBigInt();
  }

  set outTransferCount(value: BigInt) {
    this.set("outTransferCount", Value.fromBigInt(value));
  }

  get balance(): BigInt {
    let value = this.get("balance");
    return value!.toBigInt();
  }

  set balance(value: BigInt) {
    this.set("balance", Value.fromBigInt(value));
  }

  get totalIncome(): BigInt {
    let value = this.get("totalIncome");
    return value!.toBigInt();
  }

  set totalIncome(value: BigInt) {
    this.set("totalIncome", Value.fromBigInt(value));
  }

  get totalOutcome(): BigInt {
    let value = this.get("totalOutcome");
    return value!.toBigInt();
  }

  set totalOutcome(value: BigInt) {
    this.set("totalOutcome", Value.fromBigInt(value));
  }
}

export class Supply extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("token", Value.fromString(""));
    this.set("minted", Value.fromBigInt(BigInt.zero()));
    this.set("burned", Value.fromBigInt(BigInt.zero()));
    this.set("total", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Supply entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Supply entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Supply", id.toString(), this);
    }
  }

  static load(id: string): Supply | null {
    return changetype<Supply | null>(store.get("Supply", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value!.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get changedTimestamp(): BigInt | null {
    let value = this.get("changedTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set changedTimestamp(value: BigInt | null) {
    if (!value) {
      this.unset("changedTimestamp");
    } else {
      this.set("changedTimestamp", Value.fromBigInt(<BigInt>value));
    }
  }

  get minted(): BigInt {
    let value = this.get("minted");
    return value!.toBigInt();
  }

  set minted(value: BigInt) {
    this.set("minted", Value.fromBigInt(value));
  }

  get burned(): BigInt {
    let value = this.get("burned");
    return value!.toBigInt();
  }

  set burned(value: BigInt) {
    this.set("burned", Value.fromBigInt(value));
  }

  get total(): BigInt {
    let value = this.get("total");
    return value!.toBigInt();
  }

  set total(value: BigInt) {
    this.set("total", Value.fromBigInt(value));
  }
}

export class Transaction extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("block", Value.fromBigInt(BigInt.zero()));
    this.set("timestamp", Value.fromBigInt(BigInt.zero()));
    this.set("from", Value.fromBytes(Bytes.empty()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Transaction entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Transaction entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Transaction", id.toString(), this);
    }
  }

  static load(id: string): Transaction | null {
    return changetype<Transaction | null>(store.get("Transaction", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get block(): BigInt {
    let value = this.get("block");
    return value!.toBigInt();
  }

  set block(value: BigInt) {
    this.set("block", Value.fromBigInt(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get from(): Bytes {
    let value = this.get("from");
    return value!.toBytes();
  }

  set from(value: Bytes) {
    this.set("from", Value.fromBytes(value));
  }

  get to(): Bytes | null {
    let value = this.get("to");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set to(value: Bytes | null) {
    if (!value) {
      this.unset("to");
    } else {
      this.set("to", Value.fromBytes(<Bytes>value));
    }
  }
}

export class Entry extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("token", Value.fromString(""));
    this.set("main", Value.fromString(""));
    this.set("user", Value.fromString(""));
    this.set("transaction", Value.fromString(""));
    this.set("amount", Value.fromBigInt(BigInt.zero()));
    this.set("type", Value.fromString(""));
    this.set("status", Value.fromString(""));
    this.set("createdAt", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Entry entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Entry entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Entry", id.toString(), this);
    }
  }

  static load(id: string): Entry | null {
    return changetype<Entry | null>(store.get("Entry", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get token(): string {
    let value = this.get("token");
    return value!.toString();
  }

  set token(value: string) {
    this.set("token", Value.fromString(value));
  }

  get main(): string {
    let value = this.get("main");
    return value!.toString();
  }

  set main(value: string) {
    this.set("main", Value.fromString(value));
  }

  get user(): string {
    let value = this.get("user");
    return value!.toString();
  }

  set user(value: string) {
    this.set("user", Value.fromString(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value!.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }

  get amount(): BigInt {
    let value = this.get("amount");
    return value!.toBigInt();
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }

  get stAmount(): BigInt | null {
    let value = this.get("stAmount");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set stAmount(value: BigInt | null) {
    if (!value) {
      this.unset("stAmount");
    } else {
      this.set("stAmount", Value.fromBigInt(<BigInt>value));
    }
  }

  get type(): string {
    let value = this.get("type");
    return value!.toString();
  }

  set type(value: string) {
    this.set("type", Value.fromString(value));
  }

  get status(): string {
    let value = this.get("status");
    return value!.toString();
  }

  set status(value: string) {
    this.set("status", Value.fromString(value));
  }

  get createdAt(): BigInt {
    let value = this.get("createdAt");
    return value!.toBigInt();
  }

  set createdAt(value: BigInt) {
    this.set("createdAt", Value.fromBigInt(value));
  }

  get updatedAt(): BigInt | null {
    let value = this.get("updatedAt");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set updatedAt(value: BigInt | null) {
    if (!value) {
      this.unset("updatedAt");
    } else {
      this.set("updatedAt", Value.fromBigInt(<BigInt>value));
    }
  }

  get toAddr(): string | null {
    let value = this.get("toAddr");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set toAddr(value: string | null) {
    if (!value) {
      this.unset("toAddr");
    } else {
      this.set("toAddr", Value.fromString(<string>value));
    }
  }

  get availableAt(): BigInt | null {
    let value = this.get("availableAt");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set availableAt(value: BigInt | null) {
    if (!value) {
      this.unset("availableAt");
    } else {
      this.set("availableAt", Value.fromBigInt(<BigInt>value));
    }
  }

  get completionTxn(): string | null {
    let value = this.get("completionTxn");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set completionTxn(value: string | null) {
    if (!value) {
      this.unset("completionTxn");
    } else {
      this.set("completionTxn", Value.fromString(<string>value));
    }
  }
}
