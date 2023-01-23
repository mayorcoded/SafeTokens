import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "hardhat") {
    console.log(`Deploying SafeTokensModule to ${hre.network.name}. Hit ctrl + c to abort`);
  }

  const { deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await hre.getNamedAccounts();

  await deploy("SafeTokensModule", {
    args: [
      "0xf0439Cf68309E8E21D8ccAF6A7d9D2b20180Ab5d",
      "0x780b40978E0a467b94bd394Ee693616088E22372"
    ],
    from: deployer,
  });
};

export default func;

func.tags = ["SafeTokensModule"];
