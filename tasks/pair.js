task("getpair", "Sends ETH and tokens to an address")
  .addPositionalParam("token0", "Token 0 address")
  .addPositionalParam("token1", "Token 1 address")
  .setAction(async ({ token0, token1 }, { deployments }) => {
    console.info("token0", token0);
    console.info("token1", token1);
    const factoryAddress = (await deployments.get("Factory")).address;
    const factoryContract = await ethers.getContractAt(
      "UniswapV2Factory",
      factoryAddress
    );

    const pairAddress = await factoryContract.getPair(token0, token1);
    console.info("Pair address", pairAddress);
    return pairAddress;
  });
