import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  assert,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { _createTimelockProposal } from "../src/mappings/governance";
import { createProposalCreatedEvent } from "./events/ProposalCreated";
import { SPELL_3_4_0_TIMELOCK_GOVERNANCE } from "../src/common/spells";

describe("Timelock test", () => {
  test("Generate timelock id", () => {
    const id = 13035241572565140239426347309198637847481528373469095017232500194936432553205;
    const proposalCreatedEvent = createProposalCreatedEvent(BigInt.fromU64(id));

    const timelockId = _createTimelockProposal(proposalCreatedEvent);

    assert.stringEquals(
      timelockId,
      "0x784855018f91af5f996aa74ea0e9883adf646055a357a0e077af6eb2698f691e"
    );
    clearStore();
  });
});

describe("3.4.0 upgrade spell", () => {
  test("Get governance id from timelock id", () => {
    let timelockAddress = Address.fromString(
      "0xe664d294824C2A8C952A10c4034e1105d2907F46"
    );
    let network = "base";
    let governanceAddress =
      SPELL_3_4_0_TIMELOCK_GOVERNANCE[network][timelockAddress.toHexString()];

    let expectedAddress = Address.fromString(
      "0x21fBa52dA03e1F964fa521532f8B8951fC212055"
    );
    assert.stringEquals(
      governanceAddress.toHexString(),
      expectedAddress.toHexString()
    );
  });
});
