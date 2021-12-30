// deploy/01_deploy_uniswap.js

module.exports = async ({ deployments, network }) => {
  console.info('Deploying Uniswap');
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const factoryContract = await deploy('UniswapV2Factory', {
    contract: 'UniswapV2Factory',
    from: deployer,
    log: true,
    args: [deployer],
  });

  const routerContract = await deploy('UniswapV2Router02', {
    contract: 'UniswapV2Router02',
    from: deployer,
    log: true,
    args: [factoryContract.address, process.env.WMATIC_ADDRESS],
  });
};

module.exports.tags = ['Factory', 'UniswapV2Router02'];
