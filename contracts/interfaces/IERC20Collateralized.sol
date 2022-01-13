// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IERC20Collateralized {
  // Functions
  function MARKUP_ROLE (  ) external view returns ( bytes32 );
  function REWARDS_ROLE (  ) external view returns ( bytes32 );
  function aave_incentive_address (  ) external view returns ( address );
  function aave_lending_pool_address (  ) external view returns ( address );
  function buyingPrice (  ) external view returns ( uint256 );
  function claimAaveRewards (  ) external;
  function collateralBalance (  ) external view returns ( uint256 );
  function collateralPrice (  ) external view returns ( uint256 );
  function collateralRatio (  ) external view returns ( uint256 );
  function collateral_aave_address (  ) external view returns ( address );
  function collateral_address (  ) external view returns ( address );
  function harvestMaticIntoToken (  ) external;
  function initialize ( uint256 collateral, uint256 starting_ratio ) external;
  function initialized (  ) external view returns ( bool );
  function markup (  ) external view returns ( uint256 );
  function markup_decimals (  ) external view returns ( uint8 );
  function mint ( address to, uint256 amount ) external;
  function setMarkup ( uint256 markup_ ) external;
  function uniswap_router_address (  ) external view returns ( address );
  function withdraw ( address to, uint256 amount ) external;
  function wmatic_address (  ) external view returns ( address );

  // Events
  event Initialized(address owner, uint collateral, uint starting_ratio);
  event Minted(address to, uint collateralAmount, uint tokenAmount);
  event Withdrawal(address to, uint collateralAmount, uint tokenAmount);
  event MarkupUpdated(address operator, uint markup);
  event ClaimedRewards(uint256 claimed);
  event HarvestedMatic(uint256 wmatic, uint256 collateral);
}
