// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class AllBalancesReset extends ethereum.Event {
  get params(): AllBalancesReset__Params {
    return new AllBalancesReset__Params(this);
  }
}

export class AllBalancesReset__Params {
  _event: AllBalancesReset;

  constructor(event: AllBalancesReset) {
    this._event = event;
  }

  get newEra(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class Approval extends ethereum.Event {
  get params(): Approval__Params {
    return new Approval__Params(this);
  }
}

export class Approval__Params {
  _event: Approval;

  constructor(event: Approval) {
    this._event = event;
  }

  get owner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get spender(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get value(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class MainSet extends ethereum.Event {
  get params(): MainSet__Params {
    return new MainSet__Params(this);
  }
}

export class MainSet__Params {
  _event: MainSet;

  constructor(event: MainSet) {
    this._event = event;
  }

  get oldMain(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newMain(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class RSRRewarded extends ethereum.Event {
  get params(): RSRRewarded__Params {
    return new RSRRewarded__Params(this);
  }
}

export class RSRRewarded__Params {
  _event: RSRRewarded;

  constructor(event: RSRRewarded) {
    this._event = event;
  }

  get amount(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get numPeriods(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class RSRSeized extends ethereum.Event {
  get params(): RSRSeized__Params {
    return new RSRSeized__Params(this);
  }
}

export class RSRSeized__Params {
  _event: RSRSeized;

  constructor(event: RSRSeized) {
    this._event = event;
  }

  get from(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get amount(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class RewardPeriodSet extends ethereum.Event {
  get params(): RewardPeriodSet__Params {
    return new RewardPeriodSet__Params(this);
  }
}

export class RewardPeriodSet__Params {
  _event: RewardPeriodSet;

  constructor(event: RewardPeriodSet) {
    this._event = event;
  }

  get oldVal(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get newVal(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class RewardRatioSet extends ethereum.Event {
  get params(): RewardRatioSet__Params {
    return new RewardRatioSet__Params(this);
  }
}

export class RewardRatioSet__Params {
  _event: RewardRatioSet;

  constructor(event: RewardRatioSet) {
    this._event = event;
  }

  get oldVal(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get newVal(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class Staked extends ethereum.Event {
  get params(): Staked__Params {
    return new Staked__Params(this);
  }
}

export class Staked__Params {
  _event: Staked;

  constructor(event: Staked) {
    this._event = event;
  }

  get staker(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get rsrAmount(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get stRSRAmount(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class Transfer extends ethereum.Event {
  get params(): Transfer__Params {
    return new Transfer__Params(this);
  }
}

export class Transfer__Params {
  _event: Transfer;

  constructor(event: Transfer) {
    this._event = event;
  }

  get from(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get to(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get value(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class UnstakingCompleted extends ethereum.Event {
  get params(): UnstakingCompleted__Params {
    return new UnstakingCompleted__Params(this);
  }
}

export class UnstakingCompleted__Params {
  _event: UnstakingCompleted;

  constructor(event: UnstakingCompleted) {
    this._event = event;
  }

  get firstId(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get endId(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get draftEra(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get staker(): Address {
    return this._event.parameters[3].value.toAddress();
  }

  get rsrAmount(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }
}

export class UnstakingDelaySet extends ethereum.Event {
  get params(): UnstakingDelaySet__Params {
    return new UnstakingDelaySet__Params(this);
  }
}

export class UnstakingDelaySet__Params {
  _event: UnstakingDelaySet;

  constructor(event: UnstakingDelaySet) {
    this._event = event;
  }

  get oldVal(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get newVal(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class UnstakingStarted extends ethereum.Event {
  get params(): UnstakingStarted__Params {
    return new UnstakingStarted__Params(this);
  }
}

export class UnstakingStarted__Params {
  _event: UnstakingStarted;

  constructor(event: UnstakingStarted) {
    this._event = event;
  }

  get draftId(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get draftEra(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get staker(): Address {
    return this._event.parameters[2].value.toAddress();
  }

  get rsrAmount(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get stRSRAmount(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get availableAt(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }
}

export class stRSR__withdrawalsResult {
  value0: Address;
  value1: BigInt;
  value2: BigInt;

  constructor(value0: Address, value1: BigInt, value2: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromAddress(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    map.set("value2", ethereum.Value.fromUnsignedBigInt(this.value2));
    return map;
  }
}

export class stRSR extends ethereum.SmartContract {
  static bind(address: Address): stRSR {
    return new stRSR("stRSR", address);
  }

  DOMAIN_SEPARATOR(): Bytes {
    let result = super.call(
      "DOMAIN_SEPARATOR",
      "DOMAIN_SEPARATOR():(bytes32)",
      []
    );

    return result[0].toBytes();
  }

  try_DOMAIN_SEPARATOR(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "DOMAIN_SEPARATOR",
      "DOMAIN_SEPARATOR():(bytes32)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  allowance(owner_: Address, spender: Address): BigInt {
    let result = super.call(
      "allowance",
      "allowance(address,address):(uint256)",
      [ethereum.Value.fromAddress(owner_), ethereum.Value.fromAddress(spender)]
    );

    return result[0].toBigInt();
  }

  try_allowance(
    owner_: Address,
    spender: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "allowance",
      "allowance(address,address):(uint256)",
      [ethereum.Value.fromAddress(owner_), ethereum.Value.fromAddress(spender)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  approve(spender: Address, amount: BigInt): boolean {
    let result = super.call("approve", "approve(address,uint256):(bool)", [
      ethereum.Value.fromAddress(spender),
      ethereum.Value.fromUnsignedBigInt(amount)
    ]);

    return result[0].toBoolean();
  }

  try_approve(spender: Address, amount: BigInt): ethereum.CallResult<boolean> {
    let result = super.tryCall("approve", "approve(address,uint256):(bool)", [
      ethereum.Value.fromAddress(spender),
      ethereum.Value.fromUnsignedBigInt(amount)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  balanceOf(account: Address): BigInt {
    let result = super.call("balanceOf", "balanceOf(address):(uint256)", [
      ethereum.Value.fromAddress(account)
    ]);

    return result[0].toBigInt();
  }

  try_balanceOf(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("balanceOf", "balanceOf(address):(uint256)", [
      ethereum.Value.fromAddress(account)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  decimals(): i32 {
    let result = super.call("decimals", "decimals():(uint8)", []);

    return result[0].toI32();
  }

  try_decimals(): ethereum.CallResult<i32> {
    let result = super.tryCall("decimals", "decimals():(uint8)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toI32());
  }

  endIdForWithdraw(account: Address): BigInt {
    let result = super.call(
      "endIdForWithdraw",
      "endIdForWithdraw(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );

    return result[0].toBigInt();
  }

  try_endIdForWithdraw(account: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "endIdForWithdraw",
      "endIdForWithdraw(address):(uint256)",
      [ethereum.Value.fromAddress(account)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  exchangeRate(): BigInt {
    let result = super.call("exchangeRate", "exchangeRate():(int192)", []);

    return result[0].toBigInt();
  }

  try_exchangeRate(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("exchangeRate", "exchangeRate():(int192)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  main(): Address {
    let result = super.call("main", "main():(address)", []);

    return result[0].toAddress();
  }

  try_main(): ethereum.CallResult<Address> {
    let result = super.tryCall("main", "main():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  name(): string {
    let result = super.call("name", "name():(string)", []);

    return result[0].toString();
  }

  try_name(): ethereum.CallResult<string> {
    let result = super.tryCall("name", "name():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  nonces(owner_: Address): BigInt {
    let result = super.call("nonces", "nonces(address):(uint256)", [
      ethereum.Value.fromAddress(owner_)
    ]);

    return result[0].toBigInt();
  }

  try_nonces(owner_: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("nonces", "nonces(address):(uint256)", [
      ethereum.Value.fromAddress(owner_)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  rewardPeriod(): BigInt {
    let result = super.call("rewardPeriod", "rewardPeriod():(uint256)", []);

    return result[0].toBigInt();
  }

  try_rewardPeriod(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("rewardPeriod", "rewardPeriod():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  rewardRatio(): BigInt {
    let result = super.call("rewardRatio", "rewardRatio():(int192)", []);

    return result[0].toBigInt();
  }

  try_rewardRatio(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("rewardRatio", "rewardRatio():(int192)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  seizeRSR(rsrAmount: BigInt): BigInt {
    let result = super.call("seizeRSR", "seizeRSR(uint256):(uint256)", [
      ethereum.Value.fromUnsignedBigInt(rsrAmount)
    ]);

    return result[0].toBigInt();
  }

  try_seizeRSR(rsrAmount: BigInt): ethereum.CallResult<BigInt> {
    let result = super.tryCall("seizeRSR", "seizeRSR(uint256):(uint256)", [
      ethereum.Value.fromUnsignedBigInt(rsrAmount)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  symbol(): string {
    let result = super.call("symbol", "symbol():(string)", []);

    return result[0].toString();
  }

  try_symbol(): ethereum.CallResult<string> {
    let result = super.tryCall("symbol", "symbol():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  totalSupply(): BigInt {
    let result = super.call("totalSupply", "totalSupply():(uint256)", []);

    return result[0].toBigInt();
  }

  try_totalSupply(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("totalSupply", "totalSupply():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  transfer(recipient: Address, amount: BigInt): boolean {
    let result = super.call("transfer", "transfer(address,uint256):(bool)", [
      ethereum.Value.fromAddress(recipient),
      ethereum.Value.fromUnsignedBigInt(amount)
    ]);

    return result[0].toBoolean();
  }

  try_transfer(
    recipient: Address,
    amount: BigInt
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall("transfer", "transfer(address,uint256):(bool)", [
      ethereum.Value.fromAddress(recipient),
      ethereum.Value.fromUnsignedBigInt(amount)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  transferFrom(sender: Address, recipient: Address, amount: BigInt): boolean {
    let result = super.call(
      "transferFrom",
      "transferFrom(address,address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(sender),
        ethereum.Value.fromAddress(recipient),
        ethereum.Value.fromUnsignedBigInt(amount)
      ]
    );

    return result[0].toBoolean();
  }

  try_transferFrom(
    sender: Address,
    recipient: Address,
    amount: BigInt
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "transferFrom",
      "transferFrom(address,address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(sender),
        ethereum.Value.fromAddress(recipient),
        ethereum.Value.fromUnsignedBigInt(amount)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  unstakingDelay(): BigInt {
    let result = super.call("unstakingDelay", "unstakingDelay():(uint256)", []);

    return result[0].toBigInt();
  }

  try_unstakingDelay(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "unstakingDelay",
      "unstakingDelay():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  withdrawals(param0: Address, param1: BigInt): stRSR__withdrawalsResult {
    let result = super.call(
      "withdrawals",
      "withdrawals(address,uint256):(address,uint256,uint256)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );

    return new stRSR__withdrawalsResult(
      result[0].toAddress(),
      result[1].toBigInt(),
      result[2].toBigInt()
    );
  }

  try_withdrawals(
    param0: Address,
    param1: BigInt
  ): ethereum.CallResult<stRSR__withdrawalsResult> {
    let result = super.tryCall(
      "withdrawals",
      "withdrawals(address,uint256):(address,uint256,uint256)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new stRSR__withdrawalsResult(
        value[0].toAddress(),
        value[1].toBigInt(),
        value[2].toBigInt()
      )
    );
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get name_(): string {
    return this._call.inputValues[0].value.toString();
  }

  get symbol_(): string {
    return this._call.inputValues[1].value.toString();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ApproveCall extends ethereum.Call {
  get inputs(): ApproveCall__Inputs {
    return new ApproveCall__Inputs(this);
  }

  get outputs(): ApproveCall__Outputs {
    return new ApproveCall__Outputs(this);
  }
}

export class ApproveCall__Inputs {
  _call: ApproveCall;

  constructor(call: ApproveCall) {
    this._call = call;
  }

  get spender(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get amount(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class ApproveCall__Outputs {
  _call: ApproveCall;

  constructor(call: ApproveCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class InitComponentCall extends ethereum.Call {
  get inputs(): InitComponentCall__Inputs {
    return new InitComponentCall__Inputs(this);
  }

  get outputs(): InitComponentCall__Outputs {
    return new InitComponentCall__Outputs(this);
  }
}

export class InitComponentCall__Inputs {
  _call: InitComponentCall;

  constructor(call: InitComponentCall) {
    this._call = call;
  }

  get main_(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get args(): InitComponentCallArgsStruct {
    return changetype<InitComponentCallArgsStruct>(
      this._call.inputValues[1].value.toTuple()
    );
  }
}

export class InitComponentCall__Outputs {
  _call: InitComponentCall;

  constructor(call: InitComponentCall) {
    this._call = call;
  }
}

export class InitComponentCallArgsStruct extends ethereum.Tuple {
  get params(): InitComponentCallArgsParamsStruct {
    return changetype<InitComponentCallArgsParamsStruct>(this[0].toTuple());
  }

  get components(): InitComponentCallArgsComponentsStruct {
    return changetype<InitComponentCallArgsComponentsStruct>(this[1].toTuple());
  }

  get rsr(): Address {
    return this[2].toAddress();
  }

  get gnosis(): Address {
    return this[3].toAddress();
  }

  get assets(): Array<Address> {
    return this[4].toAddressArray();
  }
}

export class InitComponentCallArgsParamsStruct extends ethereum.Tuple {
  get maxAuctionSize(): BigInt {
    return this[0].toBigInt();
  }

  get dist(): InitComponentCallArgsParamsDistStruct {
    return changetype<InitComponentCallArgsParamsDistStruct>(this[1].toTuple());
  }

  get rewardPeriod(): BigInt {
    return this[2].toBigInt();
  }

  get rewardRatio(): BigInt {
    return this[3].toBigInt();
  }

  get unstakingDelay(): BigInt {
    return this[4].toBigInt();
  }

  get auctionDelay(): BigInt {
    return this[5].toBigInt();
  }

  get auctionLength(): BigInt {
    return this[6].toBigInt();
  }

  get backingBuffer(): BigInt {
    return this[7].toBigInt();
  }

  get maxTradeSlippage(): BigInt {
    return this[8].toBigInt();
  }

  get dustAmount(): BigInt {
    return this[9].toBigInt();
  }

  get issuanceRate(): BigInt {
    return this[10].toBigInt();
  }
}

export class InitComponentCallArgsParamsDistStruct extends ethereum.Tuple {
  get rTokenDist(): i32 {
    return this[0].toI32();
  }

  get rsrDist(): i32 {
    return this[1].toI32();
  }
}

export class InitComponentCallArgsComponentsStruct extends ethereum.Tuple {
  get rToken(): Address {
    return this[0].toAddress();
  }

  get stRSR(): Address {
    return this[1].toAddress();
  }

  get assetRegistry(): Address {
    return this[2].toAddress();
  }

  get basketHandler(): Address {
    return this[3].toAddress();
  }

  get backingManager(): Address {
    return this[4].toAddress();
  }

  get distributor(): Address {
    return this[5].toAddress();
  }

  get furnace(): Address {
    return this[6].toAddress();
  }

  get broker(): Address {
    return this[7].toAddress();
  }

  get rsrTrader(): Address {
    return this[8].toAddress();
  }

  get rTokenTrader(): Address {
    return this[9].toAddress();
  }
}

export class PayoutRewardsCall extends ethereum.Call {
  get inputs(): PayoutRewardsCall__Inputs {
    return new PayoutRewardsCall__Inputs(this);
  }

  get outputs(): PayoutRewardsCall__Outputs {
    return new PayoutRewardsCall__Outputs(this);
  }
}

export class PayoutRewardsCall__Inputs {
  _call: PayoutRewardsCall;

  constructor(call: PayoutRewardsCall) {
    this._call = call;
  }
}

export class PayoutRewardsCall__Outputs {
  _call: PayoutRewardsCall;

  constructor(call: PayoutRewardsCall) {
    this._call = call;
  }
}

export class PermitCall extends ethereum.Call {
  get inputs(): PermitCall__Inputs {
    return new PermitCall__Inputs(this);
  }

  get outputs(): PermitCall__Outputs {
    return new PermitCall__Outputs(this);
  }
}

export class PermitCall__Inputs {
  _call: PermitCall;

  constructor(call: PermitCall) {
    this._call = call;
  }

  get owner_(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get spender(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get value(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get deadline(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }

  get v(): i32 {
    return this._call.inputValues[4].value.toI32();
  }

  get r(): Bytes {
    return this._call.inputValues[5].value.toBytes();
  }

  get s(): Bytes {
    return this._call.inputValues[6].value.toBytes();
  }
}

export class PermitCall__Outputs {
  _call: PermitCall;

  constructor(call: PermitCall) {
    this._call = call;
  }
}

export class SeizeRSRCall extends ethereum.Call {
  get inputs(): SeizeRSRCall__Inputs {
    return new SeizeRSRCall__Inputs(this);
  }

  get outputs(): SeizeRSRCall__Outputs {
    return new SeizeRSRCall__Outputs(this);
  }
}

export class SeizeRSRCall__Inputs {
  _call: SeizeRSRCall;

  constructor(call: SeizeRSRCall) {
    this._call = call;
  }

  get rsrAmount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SeizeRSRCall__Outputs {
  _call: SeizeRSRCall;

  constructor(call: SeizeRSRCall) {
    this._call = call;
  }

  get seizedRSR(): BigInt {
    return this._call.outputValues[0].value.toBigInt();
  }
}

export class SetRewardPeriodCall extends ethereum.Call {
  get inputs(): SetRewardPeriodCall__Inputs {
    return new SetRewardPeriodCall__Inputs(this);
  }

  get outputs(): SetRewardPeriodCall__Outputs {
    return new SetRewardPeriodCall__Outputs(this);
  }
}

export class SetRewardPeriodCall__Inputs {
  _call: SetRewardPeriodCall;

  constructor(call: SetRewardPeriodCall) {
    this._call = call;
  }

  get val(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetRewardPeriodCall__Outputs {
  _call: SetRewardPeriodCall;

  constructor(call: SetRewardPeriodCall) {
    this._call = call;
  }
}

export class SetRewardRatioCall extends ethereum.Call {
  get inputs(): SetRewardRatioCall__Inputs {
    return new SetRewardRatioCall__Inputs(this);
  }

  get outputs(): SetRewardRatioCall__Outputs {
    return new SetRewardRatioCall__Outputs(this);
  }
}

export class SetRewardRatioCall__Inputs {
  _call: SetRewardRatioCall;

  constructor(call: SetRewardRatioCall) {
    this._call = call;
  }

  get val(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetRewardRatioCall__Outputs {
  _call: SetRewardRatioCall;

  constructor(call: SetRewardRatioCall) {
    this._call = call;
  }
}

export class SetUnstakingDelayCall extends ethereum.Call {
  get inputs(): SetUnstakingDelayCall__Inputs {
    return new SetUnstakingDelayCall__Inputs(this);
  }

  get outputs(): SetUnstakingDelayCall__Outputs {
    return new SetUnstakingDelayCall__Outputs(this);
  }
}

export class SetUnstakingDelayCall__Inputs {
  _call: SetUnstakingDelayCall;

  constructor(call: SetUnstakingDelayCall) {
    this._call = call;
  }

  get val(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetUnstakingDelayCall__Outputs {
  _call: SetUnstakingDelayCall;

  constructor(call: SetUnstakingDelayCall) {
    this._call = call;
  }
}

export class StakeCall extends ethereum.Call {
  get inputs(): StakeCall__Inputs {
    return new StakeCall__Inputs(this);
  }

  get outputs(): StakeCall__Outputs {
    return new StakeCall__Outputs(this);
  }
}

export class StakeCall__Inputs {
  _call: StakeCall;

  constructor(call: StakeCall) {
    this._call = call;
  }

  get rsrAmount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class StakeCall__Outputs {
  _call: StakeCall;

  constructor(call: StakeCall) {
    this._call = call;
  }
}

export class TransferCall extends ethereum.Call {
  get inputs(): TransferCall__Inputs {
    return new TransferCall__Inputs(this);
  }

  get outputs(): TransferCall__Outputs {
    return new TransferCall__Outputs(this);
  }
}

export class TransferCall__Inputs {
  _call: TransferCall;

  constructor(call: TransferCall) {
    this._call = call;
  }

  get recipient(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get amount(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class TransferCall__Outputs {
  _call: TransferCall;

  constructor(call: TransferCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class TransferFromCall extends ethereum.Call {
  get inputs(): TransferFromCall__Inputs {
    return new TransferFromCall__Inputs(this);
  }

  get outputs(): TransferFromCall__Outputs {
    return new TransferFromCall__Outputs(this);
  }
}

export class TransferFromCall__Inputs {
  _call: TransferFromCall;

  constructor(call: TransferFromCall) {
    this._call = call;
  }

  get sender(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get recipient(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get amount(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class TransferFromCall__Outputs {
  _call: TransferFromCall;

  constructor(call: TransferFromCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class UnstakeCall extends ethereum.Call {
  get inputs(): UnstakeCall__Inputs {
    return new UnstakeCall__Inputs(this);
  }

  get outputs(): UnstakeCall__Outputs {
    return new UnstakeCall__Outputs(this);
  }
}

export class UnstakeCall__Inputs {
  _call: UnstakeCall;

  constructor(call: UnstakeCall) {
    this._call = call;
  }

  get stakeAmount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class UnstakeCall__Outputs {
  _call: UnstakeCall;

  constructor(call: UnstakeCall) {
    this._call = call;
  }
}

export class WithdrawCall extends ethereum.Call {
  get inputs(): WithdrawCall__Inputs {
    return new WithdrawCall__Inputs(this);
  }

  get outputs(): WithdrawCall__Outputs {
    return new WithdrawCall__Outputs(this);
  }
}

export class WithdrawCall__Inputs {
  _call: WithdrawCall;

  constructor(call: WithdrawCall) {
    this._call = call;
  }

  get account(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get endId(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class WithdrawCall__Outputs {
  _call: WithdrawCall;

  constructor(call: WithdrawCall) {
    this._call = call;
  }
}
