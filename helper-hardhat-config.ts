import { BigNumber } from '@ethersproject/bignumber';

const { ethers } = require('hardhat');

interface INetworkConfig {
  [k: string]: { name: string };
}
const networkConfig: INetworkConfig = {
  default: {
    name: 'hardhat',
  },
  '31337': {
    name: 'localhost',
  },
  '1': {
    name: 'mainnet',
  },
  '80001': {
    name: 'mumbai',
  },
  '137': {
    name: 'polygon',
  },
};

interface IDefaultValues {
  collateralAmount: BigNumber;
  collateralRatio: number;
  collateralStartingLiquidity: number;
  wmaticStartingLiquidity: number;
}

const collateralRatio = parseFloat(process.env.COLLATERAL_RATIO || '1');

const defaultValues: IDefaultValues = {
  collateralAmount: ethers.utils.parseUnits(process.env.COLLATERAL_AMOUNT, 6),
  collateralRatio: collateralRatio,
  collateralStartingLiquidity: ethers.utils.parseUnits(
    process.env.LIQUIDITY_USDT_STARTING_AMOUNT,
    6
  ),
  wmaticStartingLiquidity: ethers.utils.parseUnits(
    process.env.LIQUIDITY_WMATIC_STARTING_AMOUNT,
    6
  ),
};

const developmentChains = ['hardhat', 'localhost'];

export { networkConfig, developmentChains, defaultValues };
