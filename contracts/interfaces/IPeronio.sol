// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IPeronio {
  function DEFAULT_ADMIN_ROLE (  ) external view returns ( bytes32 );
  function DOMAIN_SEPARATOR (  ) external view returns ( bytes32 );
  function MARKUP_ROLE (  ) external view returns ( bytes32 );
  function REWARDS_ROLE (  ) external view returns ( bytes32 );
  function AAVE_INCENTIVES_ADDRESS (  ) external view returns ( address );
  function COLLATERAL_AAVE_ADDRESS (  ) external view returns ( address );
  function COLLATERAL_ADDRESS (  ) external view returns ( address );
  function AAVE_LENDING_POOL_ADDRESS (  ) external view returns ( address );
  function UNISWAP_ROUTER_ADDRESS (  ) external view returns ( address );
  function WMATIC_ADDRESS (  ) external view returns ( address );
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
  function decimals (  ) external view returns ( uint8 );
  function decreaseAllowance ( address spender, uint256 subtractedValue ) external returns ( bool );
  function getRoleAdmin ( bytes32 role ) external view returns ( bytes32 );
  function grantRole ( bytes32 role, address account ) external;
  function harvestMaticIntoToken (  ) external;
  function hasRole ( bytes32 role, address account ) external view returns ( bool );
  function increaseAllowance ( address spender, uint256 addedValue ) external returns ( bool );
  function initialize ( uint256 collateral, uint256 starting_ratio ) external;
  function initialized (  ) external view returns ( bool );
  function markup (  ) external view returns ( uint256 );
  function markup_decimals (  ) external view returns ( uint8 );
  function mint ( address to, uint256 amount ) external;
  function name (  ) external view returns ( string memory );
  function nonces ( address owner ) external view returns ( uint256 );
  function permit ( address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s ) external;
  function renounceRole ( bytes32 role, address account ) external;
  function revokeRole ( bytes32 role, address account ) external;
  function setMarkup ( uint256 markup_ ) external;
  function supportsInterface ( bytes4 interfaceId ) external view returns ( bool );
  function symbol (  ) external view returns ( string memory );
  function totalSupply (  ) external view returns ( uint256 );
  function transfer ( address recipient, uint256 amount ) external returns ( bool );
  function transferFrom ( address sender, address recipient, uint256 amount ) external returns ( bool );
  function withdraw ( address to, uint256 amount ) external;
}
