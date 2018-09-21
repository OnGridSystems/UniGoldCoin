pragma solidity ^0.4.24;

import "../UniGoldToken.sol";


// mock class using StandardToken
contract UniGoldTokenMock is UniGoldToken {

  constructor(address _initialAccount, uint256 _initialBalance) public {
    balances[_initialAccount] = _initialBalance;
    totalSupply_ = _initialBalance;
  }

}
