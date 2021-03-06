// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts_latest/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts_latest/token/ERC20/utils/SafeERC20.sol";

import "./ERC20Mock.sol";

import "hardhat/console.sol";

contract LendingPoolMock {
    using SafeERC20 for IERC20;

    address public immutable aToken; // Aave Contract

    uint16 private _referralCode;

    constructor(address aToken_) {
        aToken = aToken_;
    }
  /**
   * @dev Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
   * - E.g. User deposits 100 USDC and gets in return 100 aUSDC
   * @param asset The address of the underlying asset to deposit
   * @param amount The amount to be deposited
   * @param onBehalfOf The address that will receive the aTokens, same as msg.sender if the user
   *   wants to receive them on his own wallet, or a different address if the beneficiary of aTokens
   *   is a different wallet
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
   *   0 if the action is executed directly by the user, without any middle-man
   **/
  function deposit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external {
      _referralCode = referralCode;
      IERC20(asset).safeTransferFrom(onBehalfOf, aToken, amount);
      ERC20Mock(aToken).mint(onBehalfOf, amount);
  }

  /**
   * @dev Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
   * E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC
   * @param asset The address of the underlying asset to withdraw
   * @param amount The underlying amount to be withdrawn
   *   - Send the value type(uint256).max in order to withdraw the whole aToken balance
   * @param to Address that will receive the underlying, same as msg.sender if the user
   *   wants to receive it on his own wallet, or a different address if the beneficiary is a
   *   different wallet
   * @return The final amount withdrawn
   **/
  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external returns (uint256) {

  }
}