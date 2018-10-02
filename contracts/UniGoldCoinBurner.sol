pragma solidity ^0.4.24;

import "./IERC223Burnable.sol";

contract UniGoldCoinBurner {
  IERC223Burnable token;

  constructor(IERC223Burnable _token) public {
    token = _token;
  }

  function tokenFallback(address _from, uint _value, bytes _data) public {
    require(msg.sender == address(token));
    token.burn(_value);
  }

}
