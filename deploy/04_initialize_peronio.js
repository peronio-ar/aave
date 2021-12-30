// deploy/04_initialize_peronio.js
const utils = require("../utils");
const { ethers } = require("hardhat");
const { defaultValues } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  console.info("Initializing Peronio contract");

  const { deployer } = await getNamedAccounts();

  const usdtAddress = utils.getDeployedContract("USDT", network.name).address;
  const peronioAddress = utils.getDeployedContract(
    "Peronio",
    network.name
  ).address;

  // Contracts
  const usdt = await ethers.getContractAt("IERC20", usdtAddress);
  const peronio = await ethers.getContractAt("ERC20Collateral", peronioAddress);

  // Check if contract is already initialized
  console.info("Checking if contract is already initialized...");
  const initialized = await peronio.initialized();
  if (initialized) {
    console.info("Already Initialized");
    return;
  }

  console.info("Checking if there is enough USDT...");
  const usdtBalance = await usdt.balanceOf(deployer);
  if (usdtBalance.lt(defaultValues.collateralAmount)) {
    throw Error("Not enough USDT funds");
  }
  console.info(
    "Approving USDT " +
      ethers.utils.formatUnits(defaultValues.collateralAmount, 6) +
      " to be spent"
  );
  await usdt.approve(peronioAddress, defaultValues.collateralAmount);
  try {
    console.info("Initializing Contract...");
    await peronio.initiliaze(
      defaultValues.collateralAmount,
      defaultValues.collateralRatio
    );
    console.info("Initialized Peronio ERC20");
  } catch (e) {
    if (e.message.indexOf("Contract already initialized") === -1) {
      throw e;
    }
    console.info("Contract already initialized");
  }
};

module.exports.tags = ["Pair"];
