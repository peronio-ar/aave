// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.2;

import "hardhat/console.sol";

contract AaveIncentivesControllerMock {
  function handleAction(
    address user,
    uint256 userBalance,
    uint256 totalSupply
  ) external {
    console.log('Not implemented', user, userBalance, totalSupply);
  }

  function getRewardsBalance(address[] calldata assets, address user)
    external
    view
    returns (uint256) {
      console.log('Not implemented', assets[0], user);
      return 0;
    }

  function claimRewards(
    address[] calldata assets,
    uint256 amount,
    address to
  ) external returns (uint256) {
    console.log('Not implemented', assets[0], amount, to);
    return 0;
  }
}
