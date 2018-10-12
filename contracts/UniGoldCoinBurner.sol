pragma solidity ^0.4.25;

import "./IERC223Burnable.sol";

contract UniGoldCoinBurner {
  IERC223Burnable token;

  constructor(IERC223Burnable _token) public {
    token = _token;
  }

  function tokenFallback(address, uint _value, bytes) public {
    require(msg.sender == address(token));
    token.burn(_value);
  }

}
