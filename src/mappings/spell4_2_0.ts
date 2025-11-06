import { NewGovernanceDeployed } from "../../generated/spell4_2_0/spell4_2_0";
import { RToken, RTokenContract } from "../../generated/schema";
import {
  Governance as GovernanceTemplate,
  Timelock as TimelockTemplate,
} from "../../generated/templates";
import { ContractName } from "../common/constants";
import { getGovernance } from "../governance/handlers";
import { getGovernanceFramework } from "./governance";

export function handleNewGovernanceDeployed(
  event: NewGovernanceDeployed
): void {
  let rToken = RToken.load(event.params.rToken.toHexString());

  if (!rToken) {
    return;
  }

  let governorAddress = event.params.newGovernor;
  let timelockAddress = event.params.newTimelock;

  let governorContract = new RTokenContract(governorAddress.toHexString());
  governorContract.rToken = rToken.id;
  governorContract.name = ContractName.GOVERNOR;
  governorContract.save();

  let timelockContract = new RTokenContract(timelockAddress.toHexString());
  timelockContract.rToken = rToken.id;
  timelockContract.name = ContractName.TIMELOCK;
  timelockContract.save();

  GovernanceTemplate.create(governorAddress);
  TimelockTemplate.create(timelockAddress);

  let governance = getGovernance(rToken.id);
  governance.save();

  getGovernanceFramework(
    governorAddress.toHexString(),
    event.block.number,
    event.block.timestamp
  );
}
