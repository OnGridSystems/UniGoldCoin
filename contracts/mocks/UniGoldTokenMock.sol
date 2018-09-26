pragma solidity ^0.4.24;

import "../UniGoldToken.sol";


// mock class using StandardToken
contract UniGoldTokenMock is UniGoldToken {

    /**
   * @dev Burns a specific amount of tokens from the target address and decrements allowance
   * @param _value uint256 The amount of token to be burned
   */
    function burnFrom(uint256 _value) public {
        burn(_value);
    }

}
