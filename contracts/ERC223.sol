pragma solidity ^0.4.24;

import "./ERC223ReceivingContract.sol";
import "./token/ERC20/BasicToken.sol";

/**
 * @title ERC223
 * @dev Simpler version of ERC223
 * See https://github.com/ethereum/EIPs/issues/223
 */
contract ERC223 is BasicToken {

    //Extended transfer event
    event Transfer(address indexed from, address indexed to, uint256 value, bytes data);

    string public name;
    string public symbol;
    uint8 public decimals;

    /**
      * @dev Transfer token for a specified address, ERC223
      * @param _to The address to transfer to.
      * @param _value The amount to be transferred.
    */
    // Standard function transfer similar to ERC20 transfer with no _data .
    // Added due to backwards compatibility reasons .
    function transfer(address _to, uint _value) public returns (bool) {

        //standard function transfer similar to ERC20 transfer with no _data
        //added due to backwards compatibility reasons
        bytes memory empty;

        return transfer(_to, _value, empty);
    }

    /**
    * @dev Transfer token for a specified address, ERC223
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    * @param _data User data.
    */
    // Function that is called when a user or another contract wants to transfer funds .
    function transfer(address _to, uint _value, bytes _data) public returns (bool) {
        require(_value <= balances[msg.sender]);
        require(_to != address(0));
        balances[msg.sender] = balanceOf(msg.sender).sub(_value);
        balances[_to] = balanceOf(_to).add(_value);
        uint length;
        assembly {
        //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(_to)
        }
        if (length > 0) {
            ERC223ReceivingContract receiver = ERC223ReceivingContract(_to);
            receiver.tokenFallback(msg.sender, _value, _data);
        }
        emit Transfer(msg.sender, _to, _value, _data);
        return true;
    }

}
