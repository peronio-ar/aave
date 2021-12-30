// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IERC20Collateral {
  function aave_incentive_address (  ) external view returns ( address );
  function allowance ( address owner, address spender ) external view returns ( uint256 );
  function approve ( address spender, uint256 amount ) external returns ( bool );
  function balanceOf ( address account ) external view returns ( uint256 );
  function burn ( uint256 amount ) external;
  function burnFrom ( address account, uint256 amount ) external;
  function buyingPrice (  ) external view returns ( uint256 );
  function claimAaveRewards (  ) external;
  function collateralBalance (  ) external view returns ( uint256 );
  function collateralPrice (  ) external view returns ( uint256 );
  function collateralRatio (  ) external view returns ( uint256 );
  function collateral_aave_address (  ) external view returns ( address );
  function collateral_address (  ) external view returns ( address );
  function decimals (  ) external view returns ( uint8 );
  function decreaseAllowance ( address spender, uint256 subtractedValue ) external returns ( bool );
  function harvestMaticIntoToken (  ) external;
  function increaseAllowance ( address spender, uint256 addedValue ) external returns ( bool );
  function initialized (  ) external view returns ( bool );
  function initiliaze ( uint256 collateral, uint256 starting_ratio ) external;
  function lending_pool_address (  ) external view returns ( address );
  function markup (  ) external view returns ( uint256 );
  function markup_decimals (  ) external view returns ( uint8 );
  function mint ( address to, uint256 amount ) external;
  function name (  ) external view returns ( string memory );
  function renounceOwnership (  ) external;
  function setMarkup ( uint16 val ) external;
  function symbol (  ) external view returns ( string memory );
  function totalSupply (  ) external view returns ( uint256 );
  function transfer ( address recipient, uint256 amount ) external returns ( bool );
  function transferFrom ( address sender, address recipient, uint256 amount ) external returns ( bool );
  function transferOwnership ( address newOwner ) external;
  function uniswap_router_address (  ) external view returns ( address );
  function withdraw ( address to, uint256 amount ) external;
  function wmatic_address (  ) external view returns ( address );
}
