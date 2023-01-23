import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "hardhat") {
    console.log(`Deploying MockToken to ${hre.network.name}. Hit ctrl + c to abort`);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("MockToken", {
    args: [10000000000000],
    from: deployer,
  });
};

export default func;

func.tags = ["MockToken"];
