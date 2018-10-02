pragma solidity ^0.4.24;
/**
* @title Contract for testing the ERC223 token fallback
* @dev This just sets the values passed in on the contract state
* It would be nice to emit an event instead, but Truffle does not currently
* support checking internal events in tests: https://github.com/trufflesuite/truffle/issues/555
*/
contract TokenFallbackMock {
  address public from;
  uint public value;
  bytes public data;
  /**
  * @dev Set state when fallback is called
  * @param _value uint the amount of the specified token
  */
  function tokenFallback(address , uint _value, bytes _data) external {
    value = _value;
    data = _data;
  }
}
