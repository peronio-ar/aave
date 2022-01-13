import 'dotenv/config';

// import utils from 'ethers';
import fs from 'fs';

import 'hardhat-deploy';
import '@tenderly/hardhat-tenderly';
import '@eth-optimism/hardhat-ovm';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-interface-generator';

import './tasks/peronio';
import './tasks/pair';
import './tasks/polygonscan';

//
// Select the network you want to deploy to here:
//
const defaultNetwork = 'localhost';

const gasPrice = parseFloat(process.env.GAS_PRICE || '1');
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? '';
const ETHERSCAN_API = process.env.ETHERSCAN_API ?? '';

function mnemonic() {
  try {
    return fs.readFileSync('./mnemonic.txt').toString().trim();
  } catch (e) {
    if (defaultNetwork !== 'localhost') {
      console.log(
        '☢️ WARNING: No mnemonic file created for a deploy account. Try `yarn run generate` and then `yarn run account`.'
      );
    }
  }
  return '';
}

module.exports = {
  defaultNetwork,
  gasPrice,
  networks: {
    localhost: {
      url: 'http://localhost:8545',
      accounts: [`${PRIVATE_KEY}`],
    },
    matic: {
      url: 'https://polygon-mainnet.infura.io/v3/2343217699c44b45851935789f1f89e6',
      gasPrice: gasPrice * 10 ** 9,
      accounts: [`${PRIVATE_KEY}`],
    },
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com/',
      gasPrice: gasPrice * 10 ** 9,
      accounts: [`${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API,
  },
  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  ovm: {
    solcVersion: '0.7.6',
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
};
