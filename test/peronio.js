const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

const collateralAmount = 1000;
const collateralRatio = 250;
const initialCollateralLiquidity = 100;

describe("Contracts Setup", function () {
  // ERC20 Mocks
  let usdtContract, amUsdtContract, wMaticContract;
  // Aave
  let lendingContract, incentivesContract;
  // Peronio
  let peronioContract;
  // Uniswap
  let factoryContract, routerContract;

  describe("ERC20 Mock Tokens", function () {
    it("Should deploy USDT Mock", async function () {
      const USDTMock = await ethers.getContractFactory("ERC20Mock");
      usdtContract = await USDTMock.deploy(
        "USDT Mock",
        "USDT",
        ethers.utils.parseUnits("10000", 6)
      );
      return;
    });

    it("Should deploy amUSDT Mock", async function () {
      const aUSDTMock = await ethers.getContractFactory("ERC20Mock");

      amUsdtContract = await aUSDTMock.deploy(
        "amUSDT Mock",
        "amUSDT",
        ethers.utils.parseUnits("10000", 6)
      );
      return;
    });

    it("Should deploy WMATIC Mock", async function () {
      const wMaticMock = await ethers.getContractFactory("ERC20Mock");

      wMaticContract = await wMaticMock.deploy(
        "WMATIC Mock",
        "WMATIC",
        ethers.utils.parseUnits("10000", 6)
      );
      return;
    });
  });

  describe("LendingPoolMock", function () {
    it("Should deploy Lending Pool", async function () {
      const LendingPoolContract = await ethers.getContractFactory(
        "LendingPoolMock"
      );

      lendingContract = await LendingPoolContract.deploy(
        amUsdtContract.address
      );
      return;
    });

    describe("deposit()", function () {
      it("Should be able to allow LendingPool as amUSDT spender", async function () {
        const [owner] = await ethers.getSigners();
        // expect(await lendingContract.purpose()).to.equal(newPurpose);
        await amUsdtContract.approve(
          lendingContract.address,
          ethers.utils.parseUnits("10000", 6)
        );
      });

      it("Should be able to deposit into LendingPool", async function () {
        const [owner] = await ethers.getSigners();
        // expect(await lendingContract.purpose()).to.equal(newPurpose);

        await lendingContract.deposit(
          amUsdtContract.address,
          ethers.utils.parseUnits("100", 6),
          owner.address,
          0
        );
      });
    });
  });

  describe("IncentivesControllerMock", function () {
    it("Should deploy AAVE Incentives Controller", async function () {
      const IncentivesController = await ethers.getContractFactory(
        "AaveIncentivesControllerMock"
      );

      incentivesContract = await IncentivesController.deploy();
      return;
    });
  });

  describe("Deploy Uniswap", function () {
    it("Should deploy UniswapV2Factory", async function () {
      const [owner] = await ethers.getSigners();
      const deployer = owner.address;
      const Factory = await ethers.getContractFactory("UniswapV2Factory");
      factoryContract = await Factory.deploy(deployer);

      return factoryContract;
    });

    it("Should deploy UniswapV2Router02", async function () {
      const Router = await ethers.getContractFactory("UniswapV2Router02");
      routerContract = await Router.deploy(
        factoryContract.address,
        wMaticContract.address
      );
      return routerContract;
    });
  });

  describe("Deploy Peronio", function () {
    it("Should deploy UniswapV2Factory", async function () {
      const ERC20CollateralContract = await ethers.getContractFactory(
        "ERC20Collateral"
      );
      peronioContract = await ERC20CollateralContract.deploy(
        "Peronio Test",
        "PERT",
        usdtContract.address,
        amUsdtContract.address,
        lendingContract.address,
        wMaticContract.address,
        routerContract.address,
        incentivesContract.address
      );
      return;
    });
  });

  describe("Liquidity Pool Pair", function () {
    it("Should create PERT/USDT pair", async function () {
      return await factoryContract.createPair(
        usdtContract.address,
        peronioContract.address
      );
      return;
    });
  });

  describe("Initialize Peronio", function () {
    it("Should approve USDT to Peronio contract", async function () {
      return await usdtContract.approve(
        peronioContract.address,
        ethers.utils.parseUnits(collateralAmount.toString(), 6)
      );
    });
    it("Should initialize Peronio contract", async function () {
      await peronioContract.initiliaze(
        ethers.utils.parseUnits(collateralAmount.toString(), 6),
        collateralRatio.toString()
      );
    });
  });

  describe("Add Liquidity", function () {
    it("Should approve USDT and PERT to Router", async function () {
      await usdtContract.approve(
        routerContract.address,
        ethers.utils.parseUnits("100", 6)
      );
      await peronioContract.approve(
        routerContract.address,
        ethers.utils.parseUnits("25000", 6)
      );
    });

    it("Should add liquidity to Router", async function () {
      const [owner] = await ethers.getSigners();

      const collateralLiquidity = initialCollateralLiquidity.toString();
      const perLiquidity = (
        initialCollateralLiquidity * collateralRatio
      ).toString();

      await routerContract.addLiquidity(
        usdtContract.address,
        peronioContract.address,
        ethers.utils.parseUnits(collateralLiquidity, 6),
        ethers.utils.parseUnits(perLiquidity, 6),
        ethers.utils.parseUnits(collateralLiquidity, 6),
        ethers.utils.parseUnits(perLiquidity, 6),
        owner.address, // Should be treasury
        9999999999
      );
    });
  });

  // END SETUP

  describe("Test returns", function () {
    const collateralLiquidity = initialCollateralLiquidity.toString();
    const perLiquidity = (
      initialCollateralLiquidity * collateralRatio
    ).toString();

    const ratioMarkedUp = parseFloat(((1 / collateralRatio) * 1.05).toFixed(6));

    it("Should be initialized", async function () {
      expect(await peronioContract.initialized()).to.equal(true);
    });

    it(
      "collateralBalance should be equal to " + collateralAmount,
      async function () {
        const val = ethers.utils.formatUnits(
          await peronioContract.collateralBalance(),
          6
        );
        expect(parseFloat(val)).to.equal(collateralAmount);
      }
    );

    it(
      "collateralPrice should be equal to " + collateralRatio,
      async function () {
        const val = ethers.utils.formatUnits(
          await peronioContract.collateralPrice(),
          6
        );
        expect(parseFloat(val)).to.equal(collateralRatio);
      }
    );

    it(
      "collateralRatio should be equal to " + 1 / collateralRatio,
      async function () {
        const val = ethers.utils.formatUnits(
          await peronioContract.collateralRatio(),
          6
        );
        expect(parseFloat(val)).to.equal(1 / collateralRatio);
      }
    );

    it("buyingPrice should be equal to " + ratioMarkedUp, async function () {
      const val = ethers.utils.formatUnits(
        await peronioContract.buyingPrice(),
        6
      );
      expect(parseFloat(val)).to.equal(ratioMarkedUp);
    });
  });
});
