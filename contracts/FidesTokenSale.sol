pragma solidity ^0.5.16;
import "./FidesToken.sol";

contract FidesTokenSale {
  address payable admin;
  FidesToken public tokenContract;
  uint256 public tokenPrice;
  uint256 public tokensSold;
  address public tokenAddress;

  event Sell(address _buyer, uint256 _amount);
  
  constructor (FidesToken _tokenContract, uint256 _tokenPrice) public {
    admin = msg.sender;
    tokenContract = _tokenContract;
    tokenPrice = _tokenPrice;
    tokenAddress = address(_tokenContract);
  }

  // multiplier function
  function multiply(uint x, uint y) internal pure returns (uint z) {
    require(y == 0 || (z = x * y) / y == x);
  }

  function buyTokens(uint256 _numberOfTokens) public payable {
    require(msg.value == multiply(_numberOfTokens, tokenPrice));
    // come back to this :)
    require(tokenContract.balanceOf(tokenAddress) >= _numberOfTokens);
    require(tokenContract.transfer(msg.sender, _numberOfTokens));
    tokensSold += _numberOfTokens;

    // emit sell event
    emit Sell(msg.sender, _numberOfTokens);
  }

  // ending token sale
  function endSale() public {
    // require admin
    require(msg.sender == admin);
    // transfer remaining tokens back to admin
    require(tokenContract.transfer(admin, tokenContract.balanceOf(tokenAddress)));
    // t-minus transfer back to admin address
    admin.transfer(address(this).balance);
  }
}