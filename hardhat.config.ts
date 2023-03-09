import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "./scripts/createRarement";
import "./scripts/verifyContract";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/types/config";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_ALCHEMY_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC, 
      },
      saveDeployments: true,
    },
    polygon_mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.POLYGON_MUMBAI_ALCHEMY_KEY}`,
      chainId: 80001,
      accounts: {
        mnemonic: process.env.MNEMONIC, 
      },
      saveDeployments: true,
    },
    polygon_mainnet: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.POLYGON_MAINNET_ALCHEMY_KEY}`,
      chainId: 137,
      accounts: {
        mnemonic: process.env.MNEMONIC, 
      },
      saveDeployments: true,
    }
  },
  gasReporter: {
    // enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 100,
    showTimeSpent: true,
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
    // apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
