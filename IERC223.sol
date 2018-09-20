pragma solidity ^0.4.24;

/* New ERC223 contract interface */

interface IERC223 {

  function name() external view returns (string);
  function symbol() external view returns (string);
  function decimals() external view returns (uint8);

  function totalSupply() external view returns (uint256);

  function balanceOf(address who) external view returns (uint256);

  function allowance(address owner, address spender) external view returns (uint256);

  function approve(address spender, uint256 value) external returns (bool);

  function transferFrom(address from, address to, uint256 value) external returns (bool);

  function transfer(address to, uint256 value) external returns (bool);
  function transfer(address to, uint value, bytes data) public returns (bool);

  event Transfer(address indexed from, address indexed to, uint value, bytes indexed data);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}
