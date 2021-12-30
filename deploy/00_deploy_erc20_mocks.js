// deploy/00_deploy_erc20_mocks.js

const { ethers } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { getArtifact, save } = deployments;

  // Only for live chains ("mumbai" and "matic")
  if (!developmentChains.includes(network.name)) {
    console.info('Polygon Network selected');
    console.info('Skipping USDT mock contract deploy');

    const erc20Artifact = await getArtifact('ERC20Mock');

    // Save Deployment
    console.info('Saving environment addresses as contracts');
    save(
      'USDT',
      Object.assign({ address: process.env.USDT_ADDRESS }, erc20Artifact)
    );
    save(
      'amUSDT',
      Object.assign({ address: process.env.AMUSDT_ADDRESS }, erc20Artifact)
    );
    save(
      'LendingPool',
      Object.assign(
        { address: process.env.AAVE_LENDING_POOL_ADDRESS },
        erc20Artifact
      )
    );
    if (network.name === 'matic') {
      save(
        'WMATIC',
        Object.assign({ address: process.env.WMATIC_ADDRESS }, erc20Artifact)
      );
      return;
    }

    // Only in mumbai network
    await deployERC20Mock('WMATIC', 10000, deploy, deployer);
    return;
  }

  // Only for development chain
  console.info('Funding hardhat');
  await network.provider.send('hardhat_setBalance', [
    deployer,
    '0x' + (100000 >>> 0).toString(2),
  ]);

  // Deploy Mock Contracts
  await deployERC20Mock('WMATIC', 10000, deploy, deployer);
  await deployERC20Mock('USDT', 20000, deploy, deployer);
  const amUSDT = await deployERC20Mock('amUSDT', 0, deploy, deployer);

  console.info('Deploy Lending Pool Mock');
  await deploy('LendingPool', {
    contract: 'LendingPoolMock',
    from: deployer,
    log: true,
    args: [amUSDT.address],
  });
};

async function deployERC20Mock(name, mintAmount, deployFn, deployer) {
  console.info('Deploy ' + name + ' Mock');
  return deployFn(name, {
    contract: 'ERC20Mock',
    from: deployer,
    log: true,
    args: [
      name + ' Mock',
      name,
      ethers.utils.parseUnits(mintAmount.toString(), 6),
    ],
  });
}
module.exports.tags = ['USDT', 'amUSDT', 'LendingPool'];
