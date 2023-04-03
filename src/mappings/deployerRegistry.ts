import { DeploymentRegistered } from "../../generated/DeployerRegistry/DeployerRegistry";
import { Deployer as DeployerTemplate } from "../../generated/templates";
import { getOrCreateDeployer } from "../common/getters";

export function handleDeploymentRegistered(event: DeploymentRegistered): void {
  const deployerAddress = event.params.deployer;

  const deployer = getOrCreateDeployer(deployerAddress);
  deployer.deployerVersion = event.params.version;
  deployer.blockNumber = event.block.number;
  deployer.save();

  // Indexing the Deployer Registry; `event.params.deployer` is the
  // address of the new deployer contract
  DeployerTemplate.create(deployerAddress);
}
