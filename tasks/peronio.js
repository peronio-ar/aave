const { BigNumber } = require('ethers');
const { getDeployedContract } = require('../utils');

task('deploy_peronio', 'Deploy Peronio')
  // .addPositionalParam('address', 'The address to check the balance from')
  .setAction(
    async ({ address }, { network, deployments, getNamedAccounts }) => {
      const { deploy } = deployments;
      const { deployer } = await getNamedAccounts();

      const routerAddress = getDeployedContract(
        'UniswapV2Router02',
        network.name
      ).address;

      const peronioContract = await deploy('Peronio', {
        contract: 'Peronio',
        from: deployer,
        log: true,
        args: [
          process.env.TOKEN_NAME,
          process.env.TOKEN_SYMBOL,
          process.env.USDT_ADDRESS,
          process.env.AMUSDT_ADDRESS,
          process.env.AAVE_LENDING_POOL_ADDRESS,
          process.env.WMATIC_ADDRESS,
          routerAddress,
          process.env.AAVE_INCENTIVE_ADDRESS,
        ],
      });
      console.info('Deployed address', peronioContract.address);
    }
  );

task('init_peronio', 'Initialiaze Peronio')
  // .addPositionalParam('address', 'The address to check the balance from')
  .setAction(async ({ address }, { network }) => {
    const collateralAmount = '100'; // USDT 100
    const collateralRatio = '250'; // USDT 100

    const peronioAddress = getDeployedContract('Peronio', network.name).address;

    console.info('Peronio Address', peronioAddress);

    const peronioContract = await ethers.getContractAt(
      'Peronio',
      peronioAddress
    );

    console.info('Initializing contract');

    await peronioContract.initialize(
      ethers.utils.parseUnits(collateralAmount, 6),
      collateralRatio
    );

    console.info('Fully Initialized!');
  });

task('check_balance', 'Check current balance')
  .addOptionalParam('address', 'Address')
  .setAction(async ({ address }, { getNamedAccounts, network }) => {
    const { deployer } = await getNamedAccounts();

    const addressToScan = address ?? deployer;
    // Get addresses
    const peronioAddress = getDeployedContract('Peronio', network.name).address;
    const usdtAddress = process.env.USDT_ADDRESS;
    const amusdtAddress = process.env.AMUSDT_ADDRESS;
    const wmaticAddress = process.env.WMATIC_ADDRESS;

    // Get contracts
    const peronioContract = await ethers.getContractAt('ERC20', peronioAddress);
    const usdtContract = await ethers.getContractAt('ERC20', usdtAddress);
    const amusdtContract = await ethers.getContractAt('ERC20', amusdtAddress);
    const wmaticContract = await ethers.getContractAt('ERC20', wmaticAddress);

    const balances = {
      MATIC: ethers.utils.formatUnits(
        await ethers.provider.getBalance(addressToScan),
        18
      ),
      WMATIC: ethers.utils.formatUnits(
        await wmaticContract.balanceOf(addressToScan),
        18
      ),
      PE: ethers.utils.formatUnits(
        await peronioContract.balanceOf(addressToScan),
        6
      ),
      USDT: ethers.utils.formatUnits(
        await usdtContract.balanceOf(addressToScan),
        6
      ),
      amUSDT: ethers.utils.formatUnits(
        await amusdtContract.balanceOf(addressToScan),
        6
      ),
    };

    console.info('Balances', balances);
  });

task('mint', 'Mint Peronio')
  .addOptionalParam('usdt', 'USDT to use')
  .setAction(async ({ token, usdt }, { getNamedAccounts, network }) => {
    const { deployer } = await getNamedAccounts();

    const usdtAmount = usdt ?? '100';

    console.info('Amount to deposit', `USDT ${usdtAmount}`);

    const peronioAddress = getDeployedContract('Peronio', network.name).address;
    const usdtAddress = process.env.USDT_ADDRESS;

    const peronioContract = await ethers.getContractAt(
      'Peronio',
      peronioAddress
    );
    const usdtContract = await ethers.getContractAt('ERC20', usdtAddress);

    const buyingPrice = await peronioContract.buyingPrice();

    console.info('buying price: ', ethers.utils.formatUnits(buyingPrice, 6));

    const peAmount = ethers.utils.parseUnits(usdtAmount, 12).div(buyingPrice);

    console.info('PE amount: ', ethers.utils.formatUnits(peAmount, 6));

    console.info(`Approving USDT ${usdtAmount}...`);
    console.info('usdtContract.address', usdtContract.address);

    await usdtContract.approve(
      peronioAddress,
      ethers.utils.parseUnits(usdtAmount, 6)
    );

    console.info('- Minting PE', ethers.utils.formatUnits(peAmount, 6));
    await peronioContract.mint(deployer, peAmount);
    console.info('Done!');
  });

task('withdraw', 'Withdraw Peronio')
  .addOptionalParam('pe', 'PE to spend')
  .setAction(async ({ pe }, { getNamedAccounts, network }) => {
    const { deployer } = await getNamedAccounts();

    const peAmount = pe ?? '250';

    console.info('Amount to deposit', `PE ${peAmount}`);

    const peronioAddress = getDeployedContract('Peronio', network.name).address;

    const peronioContract = await ethers.getContractAt(
      'Peronio',
      peronioAddress
    );

    const collateralRatio = await peronioContract.collateralRatio();

    console.info(
      'collateral ratio: ',
      ethers.utils.formatUnits(collateralRatio, 6)
    );

    const usdtAmount = ethers.utils
      .parseUnits(peAmount, 6)
      .mul(collateralRatio)
      .div(BigNumber.from(Math.pow(10, 6)).toString());

    console.info(
      'USDT amount to receive ',
      ethers.utils.formatUnits(usdtAmount, 6)
    );

    console.info(`Approving PE ${pe}...`);

    await peronioContract.approve(
      peronioAddress,
      ethers.utils.parseUnits(peAmount, 6)
    );

    console.info('Withdrawing PE', peAmount);
    await peronioContract.withdraw(
      deployer,
      ethers.utils.parseUnits(peAmount, 6)
    );
    console.info('Done!');
  });

task('mine', 'Withdraw Peronio').setAction(
  async ({ count }, { getNamedAccounts, network }) => {
    network.provider.request({
      method: 'evm_mine',
      params: [],
    });
    console.info('Done!');
  }
);

task('check_rewards', 'Check current balance').setAction(
  async ({ address }, { getNamedAccounts, network }) => {
    const { deployer } = await getNamedAccounts();

    // Get addresses
    const peronioAddress = getDeployedContract('Peronio', network.name).address;
    const amUSDTAddress = getDeployedContract('amUSDT', network.name).address;
    const incentivesAddress = process.env.AAVE_INCENTIVE_ADDRESS;

    // Get contracts
    const incentivesContract = await ethers.getContractAt(
      'IAaveIncentivesController',
      incentivesAddress
    );

    const rewards = {
      deployer: ethers.utils.formatUnits(
        await incentivesContract.getRewardsBalance([amUSDTAddress], deployer),
        18
      ),
      peContract: ethers.utils.formatUnits(
        await incentivesContract.getRewardsBalance(
          [amUSDTAddress],
          peronioAddress
        ),
        18
      ),
    };

    console.info('Rewards', rewards);
  }
);

task('claim', 'Claim Rewards').setAction(
  async ({}, { getNamedAccounts, network }) => {
    const { deployer } = await getNamedAccounts();

    // Get addresses
    const peronioAddress = getDeployedContract('Peronio', network.name).address;

    // Get contracts
    const peronioContract = await ethers.getContractAt(
      'Peronio',
      peronioAddress
    );

    console.dir(await peronioContract.claimAaveRewards());
  }
);

task('swap', 'Swap USDT for WMATIC in QuickSwap').setAction(
  async ({}, { getNamedAccounts, network }) => {
    const { deployer } = await getNamedAccounts();

    const quickswapAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

    const routerArtifact = await deployments.get('UniswapV2Router02');
    const quickswapContract = await ethers.getContractAt(
      routerArtifact.abi,
      quickswapAddress
    );

    const usdtContract = await ethers.getContractAt(
      'ERC20',
      process.env.USDT_ADDRESS
    );

    const usdtAmount = ethers.utils.parseUnits('8000', 6); // USDT 8.000

    const path = [process.env.USDT_ADDRESS, process.env.WMATIC_ADDRESS];

    await usdtContract.approve(quickswapAddress, usdtAmount);

    console.dir(
      await quickswapContract.swapExactTokensForTokens(
        usdtAmount,
        '0',
        path,
        deployer,
        '999999999999'
      )
    );
  }
);

task('add_liquidity', 'Add Liquidity WMATIC/USDT').setAction(
  async ({}, { getNamedAccounts, network }) => {
    const { deployer } = await getNamedAccounts();

    const routerArtifact = await deployments.get('UniswapV2Router02');

    const routerContract = await ethers.getContractAt(
      routerArtifact.abi,
      routerArtifact.address
    );

    const usdtContract = await ethers.getContractAt(
      'ERC20',
      process.env.USDT_ADDRESS
    );

    const wmaticContract = await ethers.getContractAt(
      'ERC20',
      process.env.WMATIC_ADDRESS
    );

    const usdtAmount = ethers.utils.parseUnits('1600', 6);
    const wmaticAmount = ethers.utils.parseUnits('1000', 18);

    await usdtContract.approve(routerArtifact.address, usdtAmount);
    await wmaticContract.approve(routerArtifact.address, wmaticAmount);

    console.dir(
      await routerContract.addLiquidity(
        process.env.USDT_ADDRESS,
        process.env.WMATIC_ADDRESS,
        usdtAmount,
        wmaticAmount,
        '1',
        '1',
        deployer,
        9999999999
      )
    );
  }
);

task('harvest', 'Harvest WMATIC and ZapIn').setAction(
  async ({}, { getNamedAccounts, network }) => {
    const { deployer } = await getNamedAccounts();

    // Get addresses
    const peronioAddress = getDeployedContract('Peronio', network.name).address;

    // Get contracts
    const peronioContract = await ethers.getContractAt(
      'Peronio',
      peronioAddress
    );

    console.dir(await peronioContract.harvestMaticIntoToken());
  }
);
