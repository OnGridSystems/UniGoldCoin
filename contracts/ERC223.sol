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
  event Transfer(
    address indexed from,
    address indexed to,
    uint256 value,
    bytes data
  );

  string public name;
  string public symbol;
  uint8 public decimals;


  /**
   * @dev Transfer token for a specified address, ERC223
   * Standard function transfer similar to ERC20 transfer with no _data .
   * Added due to backwards compatibility reasons .
   * @param _to The address to transfer to.
   * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint _value) public returns (bool) {

    bytes memory empty;
    if (isContract(_to)) {
      return transferToContract(_to, _value, empty);
    } else {
      return transferToAddress(_to, _value, empty);
    }
  }


  /**
  * @dev Transfer token for a specified address, ERC223
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  * @param _data User data.
  */
  function transfer(address _to, uint _value, bytes _data) public returns (bool) {

    if (isContract(_to)) {
      return transferToContract(_to, _value, _data);
    } else {
      return transferToAddress(_to, _value, _data);
    }
  }

  /**
  * @dev assemble the given address bytecode. If bytecode exists then the _addr is a contract.
  * @param _addr The address to assert for existing bytecode.
  */
  function isContract(address _addr) internal view returns (bool) {
    uint length;
    assembly {
      length := extcodesize(_addr)
    }
    return (length > 0);
  }

  //function that is called when transaction target is an address
  function transferToAddress(address _to, uint _value, bytes _data) private returns (bool) {
    require(_value <= balances[msg.sender]);
    require(_to != address(0));
    balances[msg.sender] = balanceOf(msg.sender).sub(_value);
    balances[_to] = balanceOf(_to).add(_value);
    emit Transfer(msg.sender, _to, _value, _data);
    return true;
  }

  //function that is called when transaction target is a contract
  function transferToContract(address _to, uint _value, bytes _data) private returns (bool) {
    require(_value <= balances[msg.sender]);
    require(_to != address(0));
    balances[msg.sender] = balanceOf(msg.sender).sub(_value);
    balances[_to] = balanceOf(_to).add(_value);
    ERC223ReceivingContract receiver = ERC223ReceivingContract(_to);
    receiver.tokenFallback(msg.sender, _value, _data);
    emit Transfer(msg.sender, _to, _value, _data);
    return true;
  }
}
