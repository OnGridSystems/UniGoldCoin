pragma solidity ^0.4.25;

import "./ERC223Burnable.sol";

contract UniGoldToken is ERC223Burnable {
  address public minter;
  string public name = "UniGoldCoin";
  string public symbol = "UGCС";
  uint8 public decimals = 4;

  event Mint(address indexed to, uint256 amount);

  /**
   * @dev constructor sets the 'minter'
   * account.
   */
  constructor(address _minter) public {
    minter = _minter;
  }

  /**
   * @dev Throws if called by any account other than the minter.
   */
  modifier onlyMinter() {
    require(msg.sender == minter);
    _;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) public onlyMinter returns (bool) {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Mint(_to, _amount);
    emit Transfer(address(0), _to, _amount);
    return true;
  }

}
