import "hardhat-deploy";
import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
dotenv.config({ path: __dirname + "/.env" });

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        blockNumber: 8360683,
      },
      // @ts-ignore
      accounts: [{
        privateKey: process.env.PRIVATE_KEY_1,
        balance: "100000000000000000000"
      }, {
        privateKey: process.env.PRIVATE_KEY_2,
        balance: "100000000000000000000"
      }]
    },
    goerli: {
      accounts: [
        process.env.PRIVATE_KEY_1,
        process.env.PRIVATE_KEY_2
      ],
      chainId: 5,
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    }
  },
  solidity: "0.8.17",
  etherscan: {
    apiKey: "2VYQK7IKZSHPJI1D84FMMP2YRM9YWETT7Y"
  }
};

export default config;
