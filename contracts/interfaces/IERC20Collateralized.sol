// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IERC20Collateralized {
  // Constants
  function MARKUP_ROLE (  ) external view returns ( bytes32 );
  function REWARDS_ROLE (  ) external view returns ( bytes32 );
  function AAVE_INCENTIVES_ADDRESS (  ) external view returns ( address );
  function AAVE_LENDING_POOL_ADDRESS (  ) external view returns ( address );
  function COLLATERAL_AAVE_ADDRESS (  ) external view returns ( address );
  function COLLATERAL_ADDRESS (  ) external view returns ( address );
  function MARKUP_DECIMALS (  ) external view returns ( uint8 );
  function UNISWAP_ROUTER_ADDRESS (  ) external view returns ( address );
  function WMATIC_ADDRESS (  ) external view returns ( address );

  // Functions
  function buyingPrice (  ) external view returns ( uint256 );
  function claimAaveRewards (  ) external;
  function collateralBalance (  ) external view returns ( uint256 );
  function collateralPrice (  ) external view returns ( uint256 );
  function collateralRatio (  ) external view returns ( uint256 );
  function harvestMaticIntoToken (  ) external;
  function initialize ( uint256 collateral, uint256 starting_ratio ) external;
  function initialized (  ) external view returns ( bool );
  function markup (  ) external view returns ( uint256 );
  function mint ( address to, uint256 amount ) external;
  function setMarkup ( uint256 markup_ ) external;
  function withdraw ( address to, uint256 amount ) external;
  
  // Events
  event Initialized(address owner, uint collateral, uint starting_ratio);
  event Minted(address to, uint collateralAmount, uint tokenAmount);
  event Withdrawal(address to, uint collateralAmount, uint tokenAmount);
  event MarkupUpdated(address operator, uint markup);
  event ClaimedRewards(uint256 claimed);
  event HarvestedMatic(uint256 wmatic, uint256 collateral);
}
