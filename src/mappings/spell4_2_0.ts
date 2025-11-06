import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  GovernanceFramework,
  RToken,
  RTokenContract,
} from "../../generated/schema";
import { NewGovernanceDeployed } from "../../generated/spell4_2_0/spell4_2_0";
import {
  Governance as GovernanceTemplate,
  Timelock as TimelockTemplate,
} from "../../generated/templates";
import { Governor } from "../../generated/templates/Governance/Governor";
import { Timelock } from "../../generated/templates/Timelock/Timelock";
import { ContractName } from "../common/constants";
import { getGovernance } from "../governance/handlers";
import { isTimepointGovernance } from "../governance/utils";

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

  initializeGovernanceFramework(
    governorAddress.toHexString(),
    timelockAddress.toHexString(),
    rToken.id,
    event.block.number,
    event.block.timestamp
  );
}

function initializeGovernanceFramework(
  governorAddress: string,
  timelockAddress: string,
  rTokenId: string,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  let governanceFramework = GovernanceFramework.load(governorAddress);

  if (!governanceFramework) {
    governanceFramework = new GovernanceFramework(governorAddress);

    let governorContract = Governor.bind(Address.fromString(governorAddress));
    let timelockContract = Timelock.bind(Address.fromString(timelockAddress));

    governanceFramework.name = governorContract.name();
    governanceFramework.contractAddress = governorAddress;
    governanceFramework.timelockAddress = timelockAddress;
    governanceFramework.executionDelay = timelockContract.getMinDelay();

    governanceFramework.votingDelay = governorContract.votingDelay();
    governanceFramework.votingPeriod = governorContract.votingPeriod();
    governanceFramework.proposalThreshold = governorContract.proposalThreshold();

    let useTimestamp = isTimepointGovernance(governanceFramework.name);
    governanceFramework.quorumNumerator = governorContract.quorumNumerator(
      useTimestamp ? blockTimestamp : blockNumber
    );
    governanceFramework.quorumDenominator = governorContract.quorumDenominator();
    governanceFramework.governance = rTokenId;

    governanceFramework.save();
  }
}
