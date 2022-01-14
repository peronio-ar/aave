// deploy/05_add_liquidity.js
const { ethers } = require('hardhat');
const { defaultValues } = require('../helper-hardhat-config');

module.exports = async ({ deployments, network }) => {
  console.info('Liquidity Pool');
  const { get } = deployments;
  const { deployer } = await getNamedAccounts();

  // Get Artifacts
  const peronioArtifact = await get('Peronio');
  const usdtArtifact = await get('USDT');
  const wmaticArtifact = await get('WMATIC');
  const amUsdtArtifact = await get('amUSDT');
  const routerArtifact = await get('UniswapV2Router02');

  // Set values

  const liquidityPools = {
    peusdt: {
      name: 'PE/USDT',
      token0: {
        // PER
        address: peronioArtifact.address,
        amount: defaultValues.collateralStartingLiquidity.mul(
          defaultValues.collateralRatio
        ),
      },
      token1: {
        // USDT
        address: usdtArtifact.address,
        amount: defaultValues.collateralStartingLiquidity,
      },
    },
    pewmatic: {
      name: 'PE/WMATIC',
      token0: {
        // PER
        address: peronioArtifact.address,
        amount: defaultValues.collateralStartingLiquidity
          .mul(defaultValues.collateralRatio)
          .mul(ethers.utils.parseUnits(process.env.WMATIC_USDT_RATE, 2))
          .div(100),
      },
      token1: {
        // WMATIC
        address: wmaticArtifact.address,
        amount: defaultValues.wmaticStartingLiquidity,
      },
    },
  };

  console.info('Iterate over liquidity pools');
  for (const [, pair] of Object.entries(liquidityPools)) {
    console.info('Adding Liquidity for ' + pair.name + '...');
    await addLiquidity(
      [pair.token0.address, pair.token0.amount],
      [pair.token1.address, pair.token1.amount],
      deployer,
      deployments
    );
  }

  console.info('---- RESULTS ----');
  console.dir({
    usdtAddress: usdtArtifact.address,
    amUsdtAddress: amUsdtArtifact.address,
    peronioAddress: peronioArtifact.address,
    wmaticAddress: wmaticArtifact.address,
    routerAddress: routerArtifact.address,
    PEUSDT: {
      PER: ethers.utils.formatUnits(liquidityPools.peusdt.token0.amount, 6),
      USDT: ethers.utils.formatUnits(liquidityPools.peusdt.token1.amount, 6),
    },
    PEWMATIC: {
      PER: ethers.utils.formatUnits(liquidityPools.pewmatic.token0.amount, 6),
      WMATIC: ethers.utils.formatUnits(
        liquidityPools.pewmatic.token1.amount,
        6
      ),
    },
    deployer,
  });
};

async function addLiquidity(
  [address0, amount0],
  [address1, amount1],
  deployer,
  deployments
) {
  const { getArtifact, get } = deployments;

  const routerArtifact = await get('UniswapV2Router02');
  const erc20Artifact = await getArtifact('ERC20');

  const token0 = await ethers.getContractAt(erc20Artifact.abi, address0);
  const token1 = await ethers.getContractAt(erc20Artifact.abi, address1);
  const router = await ethers.getContractAt(
    routerArtifact.abi,
    routerArtifact.address
  );

  const symbol0 = await token0.symbol();
  const symbol1 = await token1.symbol();

  console.info('-- Current Balance:');
  console.info(
    symbol0 + ' Balance:',
    ethers.utils.formatUnits(await token0.balanceOf(deployer), 6)
  );

  console.info(
    symbol1 + ' Balance:',
    ethers.utils.formatUnits(await token1.balanceOf(deployer), 6)
  );

  // Set approval limit
  console.info('Approving ' + symbol0 + '...');
  await token0.approve(routerArtifact.address, amount0);
  console.info('Approving ' + symbol1 + '...');
  (await token1.approve(routerArtifact.address, amount1)).wait(1);

  console.info('Adding', symbol0, ethers.utils.formatUnits(amount0, 6));
  console.info('Adding', symbol1, ethers.utils.formatUnits(amount1, 6));

  return router.addLiquidity(
    address0,
    address1,
    amount0,
    amount1,
    amount0,
    amount1,
    deployer,
    9999999999
  );
}

module.exports.tags = ['Pair'];
