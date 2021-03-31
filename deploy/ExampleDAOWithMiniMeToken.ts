/**  
An example Lego DAO: 
 - Gnosis Safe 
 - Decision engine: a fork of Compound Governor
 - token: Baylina's MiniMe token

Permissions:
 - The Decision Engine is a signer of of 1/2 multisig - the other owner is the deployer
 - The Token is owned ("controlled" in the minime terminology) by the Safe
 - The contract deployer holds the complete supply of 1000 Minime tokens

*/

import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { safeAddOwner } from "../scripts/utils";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const tokenDeployment = await deployments.get("MiniMeToken");
  const safeDeployment = await deployments.get("GnosisSafe");

  const safe = await ethers.getContractAt("GnosisSafe", safeDeployment.address);
  const token = await ethers.getContractAt(
    "MiniMeToken",
    tokenDeployment.address
  );

  const deployment = await deploy("DecisionEngine01", {
    from: deployer,
    log: true,
    args: [
      safe.address, // Gnosis Safe address
      token.address,
      10, // proposingThreshold
      4, // quorumVotes: 0
      10, // votingPeriod 10 blocks
      10, // proposalMaxOperations: 10
      0, // tokenType (minime)
    ],
  });

  // add the decision engine as a signer to the contract

  await safeAddOwner(
    safe, // safe
    deployer, // prevOwner
    deployment.address.toLowerCase(), // the Decision Engine's address
    1 // the threshold for the multisig
  );

  // generate some tokens before transfering ownership of the token
  await token.generateTokens(deployer, ethers.utils.parseEther("1000"));

  // make the safe the solo owner of the token
  await token.changeController(safe.address);
};
export default func;
func.tags = ["ExampleDAOWithMiniMeToken"];
func.dependencies = ["MiniMeToken", "GnosisSafe"];
