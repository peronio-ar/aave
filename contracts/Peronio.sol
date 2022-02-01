// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts_latest/utils/math/SafeMath.sol";
import "@openzeppelin/contracts_latest/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts_latest/access/AccessControl.sol";
import "@openzeppelin/contracts_latest/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts_latest/token/ERC20/extensions/ERC20Burnable.sol";

import "./uniswap/interfaces/IUniswapV2Router01.sol";

import "./aave/interfaces/IAaveIncentivesController.sol";
import "./aave/interfaces/ILendingPool.sol";

import "./interfaces/IERC20Collateralized.sol";

contract Peronio is ERC20, ERC20Burnable, ERC20Permit, AccessControl, IERC20Collateralized {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Aave
    address public override immutable AAVE_INCENTIVES_ADDRESS; // Incentive Contract Address
    address public override immutable AAVE_LENDING_POOL_ADDRESS; // Lending pool Contract

    // Local Router
    address public override immutable UNISWAP_ROUTER_ADDRESS;

    // WMatic ERC20 address
    address public override immutable WMATIC_ADDRESS;

    // Underlying asset address (USDT)
    address public override immutable COLLATERAL_ADDRESS;
    address public override immutable COLLATERAL_AAVE_ADDRESS;

    // Markup
    uint8 public override constant MARKUP_DECIMALS = 4;
    uint256 public override markup = 5 * 10 ** MARKUP_DECIMALS; // 5%
    
    // Initialization can only be run once
    bool public override initialized = false;
    
    // Roles
    bytes32 public override constant MARKUP_ROLE = keccak256("MARKUP_ROLE");
    bytes32 public override constant REWARDS_ROLE = keccak256("REWARDS_ROLE");

    // Collateral without decimals
    constructor(string memory name_, string memory symbol_, address collateral_address_, address collateral_aave_address_, address aave_lending_pool_address_, address wmatic_address_, address uniswap_router_address_, address aave_incentives_address_) ERC20(name_, symbol_) ERC20Permit(name_) {
        // WMatic ERC20 address
        WMATIC_ADDRESS = wmatic_address_;

        // Collateral and AAVE Token address
        COLLATERAL_ADDRESS = collateral_address_; //USDT
        COLLATERAL_AAVE_ADDRESS=collateral_aave_address_; //amUSDT

        // Uniswap Router address (Local)
        UNISWAP_ROUTER_ADDRESS = uniswap_router_address_;

        // AAVE Lending Pool Address
        AAVE_LENDING_POOL_ADDRESS = aave_lending_pool_address_;

        // AAVE Incentives Controller
        AAVE_INCENTIVES_ADDRESS = aave_incentives_address_;

        // Grant roles
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MARKUP_ROLE, _msgSender());
        _setupRole(REWARDS_ROLE, _msgSender());
    }

    // 6 Decimals
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    
    // Sets initial minting. Can only be runned once
    function initialize(uint256 collateral, uint256 starting_ratio) override external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!initialized, 'Contract already initialized');
        require(ERC20(COLLATERAL_ADDRESS).decimals() == decimals(), 'Decimals from collateral and this ERC20 must match');
        
        // Get USDT from user
        IERC20(COLLATERAL_ADDRESS).safeTransferFrom(_msgSender(), address(this), collateral);
        
        // Zaps into amUSDT
        zapCollateral(collateral);

        _mint(_msgSender(), starting_ratio.mul(collateral));

        // Lock contract to prevent to be initialized twice
        initialized = true;
        emit Initialized(_msgSender(), collateral, starting_ratio);
    }

    // Sets markup for minting function
    function setMarkup(uint256 markup_) override public onlyRole(MARKUP_ROLE) {
        markup = markup_;
        emit MarkupUpdated(_msgSender(), markup_);
    }
    
    // Receive Collateral token and mints the proportional tokens
    function mint(address to, uint256 amount) override external { //Amount for this ERC20
        // Calculate buying price (Collateral ratio + Markup)
        uint collateral_amount = buyingPrice().mul(amount).div(10 ** decimals());

        // Transfer Collateral Token (USDT) to this contract
        IERC20(COLLATERAL_ADDRESS).safeTransferFrom(_msgSender(), address(this), collateral_amount);

        // Zaps collateral into Collateral AAVE Token amUSDT
        zapCollateral(collateral_amount);

        _mint(to, amount);
        emit Minted(_msgSender(), collateral_amount, amount);
    }
    
    // Receives Main token burns it and returns Collateral Token proportionally
    function withdraw(address to, uint amount) override external { //Amount for this ERC20
        // Transfer collateral back to user wallet to current contract
        uint collateralAmount = collateralRatio().mul(amount).div(10 ** decimals());

        // Claim USDT in exchange of AAVE Token amUSDT
        unzapCollateral(collateralAmount);

        // Transfer back Collateral Token (USDT) the user
        IERC20(COLLATERAL_ADDRESS).safeTransfer(to, collateralAmount);

        //Burn tokens
        _burn(_msgSender(), amount);

        emit Withdrawal(_msgSender(), collateralAmount, amount);
    }

    // Zaps collateral into Collateral AAVE Token amUSDT
    function zapCollateral(uint amount) private {
        // Deposit USDT to amUSDT
        IERC20(COLLATERAL_ADDRESS).approve(AAVE_LENDING_POOL_ADDRESS, amount);
        ILendingPool(AAVE_LENDING_POOL_ADDRESS).deposit(COLLATERAL_ADDRESS, amount, address(this), 0);
    }

    // Claim USDT in exchange of AAVE Token amUSDT
    function unzapCollateral(uint amount) private {
        // Withdraw USDT in exchange of me giving amUSDT
        IERC20(COLLATERAL_AAVE_ADDRESS).approve(AAVE_LENDING_POOL_ADDRESS, amount);
        ILendingPool(AAVE_LENDING_POOL_ADDRESS).withdraw(COLLATERAL_ADDRESS, amount, address(this));
    }
    
    // Gets current Collateral Balance (USDT) in vault
    function collateralBalance() public view override returns (uint256){
        return ERC20(COLLATERAL_AAVE_ADDRESS).balanceOf(address(this));
    }
    
    // Gets current ratio: Collateral Balance in vault / Total Supply
    function collateralRatio() public view override returns (uint256){
        return collateralBalance().mul(10 ** decimals()).div(this.totalSupply());
    }

    // Gets current ratio: Total Supply / Collateral Balance in vault
    function collateralPrice() external view override returns (uint256) {
        return (this.totalSupply().mul(10 ** decimals())).div(collateralBalance()); 
    }

    // Gets current ratio: collateralRatio + markup
    function buyingPrice() public view override returns (uint256) {
        uint base_price = collateralRatio();
        uint fee = (base_price.mul(markup)).div(10 ** (MARKUP_DECIMALS + 2));
        return base_price + fee;
    }

    // Claim AAVE Rewards (WMATIC) into this contract
    function claimAaveRewards() override external onlyRole(REWARDS_ROLE) {
        IAaveIncentivesController aaveContract = IAaveIncentivesController(AAVE_INCENTIVES_ADDRESS);
        // we're only checking for one asset (Token which is an interest bearing amToken)
        address[] memory rewardsPath = new address[](1);
                rewardsPath[0] = COLLATERAL_AAVE_ADDRESS;

        // check how many matic are available to claim
        uint256 rewardBalance = aaveContract.getRewardsBalance(rewardsPath, address(this));

        // we should only claim rewards if its over 0.
        if(rewardBalance > 2){
            aaveContract.claimRewards(rewardsPath, rewardBalance, address(this));
        }

        emit ClaimedRewards(rewardBalance);
    }

    // Swap MATIC into USDT
    function harvestMaticIntoToken() override external onlyRole(REWARDS_ROLE) {
        // claims any available Matic from the Aave Incentives contract.
        IERC20 wMaticContract = IERC20(WMATIC_ADDRESS);
        uint256 _wmaticBalance = wMaticContract.balanceOf(address(this));

        if(_wmaticBalance > 2) {
            address[] memory path = new address[](2);
                path[0] = WMATIC_ADDRESS;
                path[1] = COLLATERAL_ADDRESS;
    
            wMaticContract.safeApprove(UNISWAP_ROUTER_ADDRESS, _wmaticBalance);
            
            // if successful this should increase the total MiMatic held by contract
            IUniswapV2Router01(UNISWAP_ROUTER_ADDRESS).swapExactTokensForTokens(_wmaticBalance, uint256(0), path, address(this), block.timestamp.add(1800));
            
            uint256 newBalance = IERC20(COLLATERAL_ADDRESS).balanceOf(address(this));

            // Just being safe
            IERC20(COLLATERAL_ADDRESS).safeApprove(AAVE_LENDING_POOL_ADDRESS, 0);
            // Approve Transfer _amount usdt to lending pool
            IERC20(COLLATERAL_ADDRESS).safeApprove(AAVE_LENDING_POOL_ADDRESS, newBalance);
            // then we need to deposit it into the lending pool
            zapCollateral(newBalance);

            emit HarvestedMatic(_wmaticBalance, newBalance);
        }
    }
}