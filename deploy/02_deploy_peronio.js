// deploy/02_deploy_contracts.js
const utils = require('../utils');

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const usdtContract = utils.getDeployedContract('USDT', network.name);
  const amUsdtContract = utils.getDeployedContract('amUSDT', network.name);
  const routerContract = utils.getDeployedContract(
    'UniswapV2Router02',
    network.name
  );
  const aaveLendingPool = utils.getDeployedContract(
    'LendingPool',
    network.name
  );

  await deploy('Peronio', {
    contract: 'ERC20Collateral',
    from: deployer,
    log: true,
    args: [
      process.env.TOKEN_NAME,
      process.env.TOKEN_SYMBOL,
      usdtContract.address,
      amUsdtContract.address,
      aaveLendingPool.address,
      process.env.WMATIC_ADDRESS,
      routerContract.address,
      process.env.AAVE_INCENTIVE_ADDRESS,
    ],
  });
};

module.exports.tags = ['Peronio'];
