// deploy/03_create_pairs.js
const utils = require('../utils');
const { ethers } = require('hardhat');

module.exports = async ({ deployments, network }) => {
  console.info('Creating Pairs');
  const { getArtifact, save } = deployments;

  const addresses = {
    usdt: utils.getDeployedContract('USDT', network.name).address,
    wmatic: utils.getDeployedContract('WMATIC', network.name).address,
    peronio: utils.getDeployedContract('Peronio', network.name).address,
    factory: utils.getDeployedContract('UniswapV2Factory', network.name)
      .address,
    router: utils.getDeployedContract('UniswapV2Router02', network.name)
      .address,
  };
  const contracts = {
    usdt: await ethers.getContractAt('IERC20', addresses.usdt),
    wmatic: await ethers.getContractAt('ERC20Collateral', addresses.wmatic),
    peronio: await ethers.getContractAt('ERC20Collateral', addresses.peronio),
    factory: await ethers.getContractAt('UniswapV2Factory', addresses.factory),
    router: await ethers.getContractAt('UniswapV2Router02', addresses.factory),
  };

  const currentPair = await contracts.factory.getPair(
    addresses.usdt,
    addresses.peronio
  );

  if (currentPair !== '0x0000000000000000000000000000000000000000') {
    console.info('Pair already exists');
    return;
  }

  try {
    await contracts.factory.createPair(addresses.usdt, addresses.peronio);
    console.info('Created pair PE/USDT');

    await contracts.factory.createPair(addresses.wmatic, addresses.peronio);
    console.info('Created pair PE/WMATIC');

    addresses.pairPEUSDT = await contracts.factory.getPair(
      addresses.usdt,
      addresses.peronio
    );

    addresses.pairPEWMATIC = await contracts.factory.getPair(
      addresses.wmatic,
      addresses.peronio
    );
  } catch (e) {
    console.error('Error while trying to create pair');
    throw e;
  }

  if (addresses.pair === '0x0000000000000000000000000000000000000000') {
    throw 'Pair not found';
  }

  const pairArtifact = await getArtifact('UniswapV2Pair');

  console.info('Pair PE/USDT created on address:', addresses.pairPEUSDT);
  console.info('Pair PE/WMATIC created on address:', addresses.pairPEWMATIC);

  // Save Deployments
  await save(
    'PairPEUSDT',
    Object.assign({ address: addresses.pairPEUSDT }, pairArtifact)
  );

  await save(
    'PairPEWMATIC',
    Object.assign({ address: addresses.pairPEWMATIC }, pairArtifact)
  );
};

module.exports.tags = ['Pair'];
