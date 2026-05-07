import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import * as dotenv from "dotenv"
dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { settings: { optimizer: { enabled: true, runs: 200 } }, version: "0.8.20" },
      { settings: { optimizer: { enabled: true, runs: 200 } }, version: "0.8.24" }
    ]
  },
  networks: {
    amoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  }
}

export default config