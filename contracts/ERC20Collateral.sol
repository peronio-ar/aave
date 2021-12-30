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

contract ERC20Collateral is ERC20, ERC20Burnable, ERC20Permit, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Aave
    address public immutable aave_incentive_address; // Incentive Contract Address
    address public immutable aave_lending_pool_address; // Lending pool Contract

    // Local Router
    address public immutable uniswap_router_address;

    // WMatic ERC20 address
    address public immutable wmatic_address;

    // Underlying asset address (USDT)
    address public immutable collateral_address;
    address public immutable collateral_aave_address;

    // Markup
    uint8 public constant markup_decimals = 4;
    uint256 public markup = 5 * 10 ** markup_decimals; // 5%
    
    // Initialization can only be run once
    bool public initialized = false;
    
    // Events
    event Initialized(address owner, uint collateral, uint starting_ratio);
    event Minted(address to, uint collateralAmount, uint tokenAmount);
    event Withdrawal(address to, uint collateralAmount, uint tokenAmount);

    // Roles
    bytes32 public MARKUP_ROLE = keccak256("MARKUP_ROLE");
    bytes32 public REWARDS_ROLE = keccak256("REWARDS_ROLE");

    // Collateral without decimals
    constructor(string memory name_, string memory symbol_, address collateral_address_, address collateral_aave_address_, address aave_lending_pool_address_, address wmatic_address_, address uniswap_router_address_, address aave_incentive_address_) ERC20(name_, symbol_) ERC20Permit(name_) {
        // WMatic ERC20 address
        wmatic_address = wmatic_address_;

        // Collateral and AAVE Token address
        collateral_address = collateral_address_; //USDT
        collateral_aave_address=collateral_aave_address_; //amUSDT

        // Uniswap Router address (Local)
        uniswap_router_address = uniswap_router_address_;

        // AAVE Lending Pool Address
        aave_lending_pool_address = aave_lending_pool_address_;

        // AAVE Incentives Controller
        aave_incentive_address = aave_incentive_address_;

        // Grant roles
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MARKUP_ROLE, _msgSender());
        _setupRole(REWARDS_ROLE, _msgSender());
    }

    // 6 Decimals
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    
    // Sets initial minting. Cna only be runned once
    function initiliaze(uint256 collateral, uint256 starting_ratio) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!initialized, 'Contract already initialized');
        IERC20 collateralContract = IERC20(collateral_address);
        
        require(ERC20(collateral_address).decimals() == decimals(), 'Decimals from collateral and this ERC20 must match');
        
        // Get USDT from user
        collateralContract.safeTransferFrom(_msgSender(), address(this), collateral);
        
        // Zaps into amUSDT
        zapCollateral(collateral);

        _mint(_msgSender(), starting_ratio.mul(collateral));
        initialized = true;
        emit Initialized(_msgSender(), collateral, starting_ratio);
    }

    // Sets markup for minting function
    function setMarkup(uint256 markup_) public onlyRole(MARKUP_ROLE) {
        require(markup_ >= 0, 'Contract already initialized');
        markup = markup_;
    }
    
    // Receive Collateral token and mints the proportional tokens
    function mint(address to, uint256 amount) public { //Amount for this ERC20
        // Calculate buying price (Collateral ratio + Markup)
        uint collateral_amount = buyingPrice().mul(amount).div(10 ** decimals());

        // Transfer Collateral Token (USDT) to this contract
        IERC20(collateral_address).safeTransferFrom(_msgSender(), address(this), collateral_amount);

        // Zaps collateral into Collateral AAVE Token amUSDT
        zapCollateral(amount);

        _mint(to, amount);
        emit Minted(_msgSender(), collateral_amount, amount);
    }
    
    // Receives Main token burns it and returns Collateral Token proportionally
    function withdraw(address to, uint amount) public { //Amount for this ERC20
        // Transfer collateral back to user wallet to current contract
        uint collateralAmount = collateralRatio().mul(amount).div(10 ** decimals());

        // Claim USDT in exchange of AAVE Token amUSDT
        unzapCollateral(amount);

        // Transfer back Collateral Token (USDT) the user
        IERC20(collateral_address).safeTransfer(to, collateralAmount);

        //Burn tokens
        _burn(_msgSender(), amount);

        emit Withdrawal(_msgSender(), collateralAmount, amount);
    }

    // Zaps collateral into Collateral AAVE Token amUSDT
    function zapCollateral(uint amount) private {
        // Deposit USDT to amUSDT
        IERC20(collateral_address).approve(aave_lending_pool_address, amount);
        ILendingPool(aave_lending_pool_address).deposit(collateral_address, amount, address(this), 0);
    }

    // Claim USDT in exchange of AAVE Token amUSDT
    function unzapCollateral(uint amount) private {
        // Withdraw USDT in exchange of me giving amUSDT
        IERC20(collateral_aave_address).approve(aave_lending_pool_address, amount);
        ILendingPool(aave_lending_pool_address).withdraw(collateral_address, amount, address(this));
    }
    
    // Gets current Collateral Balance (USDT) in vault
    function collateralBalance() public view returns (uint256){
        return ERC20(collateral_aave_address).balanceOf(address(this));
    }
    
    // Gets current ratio: Collateral Balance in vault / Total Supply
    function collateralRatio() public view returns (uint256){
        return collateralBalance().mul(10 ** decimals()).div(this.totalSupply());
    }

    // Gets current ratio: Total Supply / Collateral Balance in vault
    function collateralPrice() public view returns (uint256) {
        return (this.totalSupply().mul(10 ** decimals())).div(collateralBalance()); 
    }

    // Gets current ratio: collateralRatio + markup
    function buyingPrice() public view returns (uint256) {
        uint base_price = collateralRatio();
        uint fee = (base_price.mul(markup)).div(10 ** (markup_decimals + 2));
        return base_price + fee;
    }

    // Claim AAVE Rewards (WMATIC) into this contract
    function claimAaveRewards() public onlyRole(REWARDS_ROLE) {
        IAaveIncentivesController aaveContract = IAaveIncentivesController(aave_incentive_address);
        // we're only checking for one asset (Token which is an interest bearing amToken)
        address[] memory rewardsPath = new address[](1);
                rewardsPath[0] = collateral_aave_address;

        // check how many matic are available to claim
        uint256 rewardBalance = aaveContract.getRewardsBalance(rewardsPath, address(this));

        // we should only claim rewards if its over 0.
        if(rewardBalance > 2){
            aaveContract.claimRewards(rewardsPath, rewardBalance, address(this));
        }
    }

    // Swap MATIC into USDT
    function harvestMaticIntoToken() public onlyRole(REWARDS_ROLE) {
        // claims any available Matic from the Aave Incentives contract.
        IERC20 wMaticContract = IERC20(wmatic_address);
        uint256 _wmaticBalance = wMaticContract.balanceOf(address(this));

        if(_wmaticBalance > 2) {
            address[] memory path = new address[](2);
                path[0] = wmatic_address;
                path[1] = collateral_address;
    
            wMaticContract.safeApprove(uniswap_router_address, _wmaticBalance);
            
            // if successful this should increase the total MiMatic held by contract
            IUniswapV2Router01(uniswap_router_address).swapExactTokensForTokens(_wmaticBalance, uint256(0), path, address(this), block.timestamp.add(1800));
            
            uint256 newBalance = IERC20(collateral_address).balanceOf(address(this));

            // Just being safe
            IERC20(collateral_address).safeApprove(aave_lending_pool_address, 0);
            // Approve Transfer _amount usdt to lending pool
            IERC20(collateral_address).safeApprove(aave_lending_pool_address, newBalance);
            // then we need to deposit it into the lending pool
            zapCollateral(newBalance);
        }
    }
}