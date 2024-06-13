import { Address } from "@graphprotocol/graph-ts";
import { Network } from "./constants";

export const SPELL_3_4_0_TIMELOCK_GOVERNANCE = new Map<
  string,
  Map<Address, Address>
>();

SPELL_3_4_0_TIMELOCK_GOVERNANCE.set(
  Network.MAINNET,
  new Map<Address, Address>()
);

SPELL_3_4_0_TIMELOCK_GOVERNANCE.set(Network.BASE, new Map<Address, Address>());

// eUSD
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.MAINNET)!.set(
  Address.fromString("0x7BEa807798313fE8F557780dBD6b829c1E3aD560"),
  Address.fromString("0xf4A9288D5dEb0EaE987e5926795094BF6f4662F8")
);

// ETH+
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.MAINNET)!.set(
  Address.fromString("0x5d8A7DC9405F08F14541BA918c1Bf7eb2dACE556"),
  Address.fromString("0x868Fe81C276d730A1995Dc84b642E795dFb8F753")
);

// hyUSD (mainnet)
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.MAINNET)!.set(
  Address.fromString("0x788Fd297B4d497e44e4BF25d642fbecA3018B5d2"),
  Address.fromString("0x3F26EF1460D21A99425569Ef3148Ca6059a7eEAe")
);

// USDC+
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.MAINNET)!.set(
  Address.fromString("0x9D769914eD962C4E609C8d7e4965940799C2D6C0"),
  Address.fromString("0xfB4b59f89657B76f2AdBCFf5786369f0890c0E6e")
);

// USD3
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.MAINNET)!.set(
  Address.fromString("0x12e4F043c6464984A45173E0444105058b6C3c7B"),
  Address.fromString("0x441808e20E625e0094b01B40F84af89436229279")
);

// rgUSD
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.MAINNET)!.set(
  Address.fromString("0xf33b8F2284BCa1B1A78142aE609F2a3Ad30358f3"),
  Address.fromString("0xA82Df5F4c8669a358CE54b8784103854a7f11dAf")
);

// hyUSD (base)
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.BASE)!.set(
  Address.fromString("0x4284D76a03F9B398FF7aEc58C9dEc94b289070CF"),
  Address.fromString("0xffef97179f58a582dEf73e6d2e4BcD2BDC8ca128")
);

// bsdETH
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.BASE)!.set(
  Address.fromString("0xe664d294824C2A8C952A10c4034e1105d2907F46"),
  Address.fromString("0x21fBa52dA03e1F964fa521532f8B8951fC212055")
);

// iUSDC
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.BASE)!.set(
  Address.fromString("0x520CF948147C3DF196B8a21cd3687e7f17555032"),
  Address.fromString("0xB5Cf3238b6EdDf8e264D44593099C5fAaFC3F96D")
);

// Vaya
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.BASE)!.set(
  Address.fromString("0x48f4EA2c10E6665A7B77Ad6B9BD928b21CBe176F"),
  Address.fromString("0xA6Fa215AB89e24310dc27aD86111803C443186Eb")
);

// MAAT
SPELL_3_4_0_TIMELOCK_GOVERNANCE.get(Network.BASE)!.set(
  Address.fromString("0x88CF647f1CE5a83E699157b9D84b5a39266F010D"),
  Address.fromString("0x382Ee5dBaCA900211D0B64D2FdB180C4B276E5ce")
);
