pragma solidity ^0.4.24;

import "../ERC223Burnable.sol";

contract ERC223Mock is ERC223Burnable {
    string public name = "UniGoldCoin";
    string public symbol = "UGCС";
    uint8 public decimals = 0;

    constructor(uint256 supply, uint256 ownerBalance) public {
        totalSupply_ = supply;
        balances[msg.sender] = ownerBalance;
    }

}
