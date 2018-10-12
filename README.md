# UniGoldCoin and emission governance

[![Build Status](https://travis-ci.org/OnGridSystems/UniGoldCoin.svg?branch=master)](https://travis-ci.org/OnGridSystems/UniGoldCoin)

UniGoldCoin is indivisible token representing the right to reclaim physical gold coin. 
The digital token gets created after physical gold coin batch got manufactured. 
The creaton of the digital tokens governed by flexible governance scheme.

Deployed on Ethereum mainnet:
* Token: [0xe0B5a364F86DfC046A2A5387450dBe46a48027C1](https://etherscan.io/address/0xe0b5a364f86dfc046a2a5387450dbe46a48027c1)
* Congress: [0x37f35f0F142c273CC2C94bc719e68cC81E757A28](https://etherscan.io/address/0x37f35f0f142c273cc2c94bc719e68cc81e757a28)

## Contracts
### Token
* **Interface: ERC-223*** (ERC-20 compatible). ERC-20 is the most liquid form of the token 
supported by the most crypto exchanges, both legacy and decentralized. ERC-223 supports additional 
functionality of receiving contract and more automation. In this case, the token 
can be burnt automatically when received, and we use this to guarantee its invalidation after
owner claimed its physical coins;
* **Decimals: 4** 
* **Symbol: UGCС**, UGC has been already used at the moment and we's like to have the 
non-conflicting ticker code;
* **Name: “UniGoldCoin”**;
* **Network: Ethereum mainnet** - main Ethereum network is second-size value-transfer peer-to-peer 
system after Bitcoin and the most popular smart contract machine. The most of the token ecosystem is concentrated around 
Ethereum mainnet;
* **Burnable: yes** - the ability to discard user's **own** tokens is always a good idea. Any holder 
can throw its tokens (obviously having no interest to do this). Our platform burns just-received tokens
when the physical artifact gets reclaimed. Burning decreases circulating supply, economic 
analysts interpret these events as strong inflation signals;
* **Approvable: no** - the very limited supply and indivisibility makes the spending approval
non-useful in practice, so we discarded this functionality to keep the token compact and efficient;
* **Mintable: yes, through quorum of voters** - The emission gets triggered when each batch of
the tokens gets manufactured. To avoid voluntary minting and situations when some private keys get compromised, we allow 
minting via quorum of votes through governance contract called Congress.
* **Cap: no** - The maximum circulating amount of tokens will never exceed the number of 
physical coins. After the coins get reclaimed, and tokens get burnt, the token amount in 
the wild will be less than a number of existing gold coins.

### Burner

Burner contract receives and burns UniGoldCoin token and triggers coin delivery to the sender.

### Congress

The Congress contract allows to execute certain actions (token minting in this case) via majority of votes. 
In contrast to traditional Ownable pattern, Congress protects the managed contract (token) against 
unfair behaviour of minority (for example, a single founder having one of the project keys has no 
power to mint the token until other(s) vote for the operation).
Majority formula is ```voters/2+1```. The voters list is formed dynamically through the voting. Voters 
can be added if current majority trusts new party. The party can be removed from the voters if it
has been compromised (majority executes untrust operation on it to do this).

The Congress intentionally has primitive interface to hide proposal management complexity. 
The interaction with it looks like:
- on the first call with given arguments the proposal is created internally and votes set to 1,
- every next call with the same args increments count of the voters (only unique votes increment the counter),
- when majority achieved, the proposal gets automaticall executed - managed contract called with given arguments.
The votes can be only positive (if voter is against proposal it should not vote). 

### Token minting through governance

#### Initial deployment

1. When Congress contract deployed, the sender becomes a single voter.
2. Then the Token gets, Congress address provided as an argument. Congress becomes a single
minter - the tokens can be minted only by given address.
3. Then Token address should be provisioned into the Congress via setToken(Token) call. This method can be executed 
only once, the token address becomes immutable after this and both contracts get locked on each other.

```
Voter1       Voter2       Voter3      Voter4      Voter5           Congress                 Token
  |            |            |           |           |                 |                       |
  |            |           1. deploy Congress       |                 |                       |
  +-+-----------------------+----------------------------------------->                       |
  |||          |            |           |           |                 |                       |
  |||          |            | 2. deploy Token(Congress)               |                       |
  ||+-----------------------+-----------------------------------------------------------------> 
  |||          |              3. setToken(Token)                      |                       |
  ||+-----------------------+-----------+-----------+----------------->                       |
  |||          |            |           |           |                 |                       |

```
 
#### 1/1 majority
Congress has a sender address (who deployed the contract) as a single voter,
the majority is 1/1, and the single mint() call will go through all the proposal steps - it gets created, votes set 
to 1, majority gets achieved and the .mint() method on the token gets immediately executed.

```
Voter1       Voter2       Voter3      Voter4      Voter5           Congress                 Token
  |||          |            |           |           |                 |                       |
  |||          |            |           |           |                 |                       |
  |||          |            |  4. mint(args...)                       |                       |
  ||+-----------------------------------+-----------+-----------------> 1/1, mint             |
  |||          |            |           |           |                 +---------------------->|
```

#### Add second voter
The scheme with the single voter doesn't give any protection against unfair behaviour, and 1/1 state is transient to add
other trusted parties. 
The new voter candidate should generate Ethereum private key on its own and provide address to the Voter1. Then Voter1
executes .trust(Voter2) transaction (5) and since it's a single voter, the single call is enough to allow this request.

#### Minting in 2/2 consensus
Now Congress has 2 voters configuration and majority formulae is 2/2. If the team decides to mint some amount of tokens
they should both agree on minting parameters (_to, _amount, _batchCode), these parameters get hashed and reference to a 
common proposal hash. 
6. When the first voter executes .mint(), it triggers proposal creation and +1 vote to it. When the second voter does the 
same, the existing proposal is found by its hash and counter incremented. Since it achieved majority, the proposal gets 
executed running actual token minting. After proposal executed it gets locked forever - all the next calls with the same
arguments will throw

```
Voter1       Voter2       Voter3      Voter4      Voter5           Congress                 Token
  |||          |            |           |           |                 |                       |
  |||          |            | 5. trust(Voter2).                       |                       |
  ||+-----------------------------------+-----------+-----------------> 1/1, trust, =2 voters |
  |||          |||          |           |           |                 |                       |
  |||          |||          |  6. mint(args...)     |                 |                       |
  |||          ||+---------------------------------------------------->  1/2, wait            |
  ||+----------------------------------------------------------------->  2/2, mint            |
  |||          |||          |           |           |                 +----------------------->
  |||          |||          |           |           |                 |                       |
```

#### Adding third voter
> The 2-voters sheme has no protection against loss of a single key. If one of the secrets lost, the further operations
will be impossible, so it's recommended to have redundant options like 2/3, 3/4, 3/5, 4/6, 4/7, 5/8 and so on.

Now both (2/2) voters can add third one via .trust(Voter3) command (7,8).

```
Voter1       Voter2       Voter3      Voter4      Voter5           Congress 
  |||          |||          |           |           |                 |
  |||          |||          |  7. trust(Voter3), 1/2|                 |
  |||          ||+----------------------+----------------------------->1/2, wait
  |||          |||          |           |           |                 |
  |||          |||          |  8. trust(Voter3), 2/2 = 3Voters        |
  ||+-----------------------------------+-----------+----------------->2/2, trust, =3 voters
  |||          |||         |||          |           |                 |
```

#### Minting with 2/3 consensus
with 3 voters request gets executed after 2 votes. On the diagram below Voter2 and Voter3 do the mint request with given
arguments. The first request initiates proposal and sets votes to 1, the second increments counter to 2. 
2 votes is enough for 3 parties, so it gets executed.
```
Voter1       Voter2       Voter3      Voter4      Voter5           Congress                 Token 
  |||          |||          |||         |           |                 |                       |
  |||          |||          |||    9. mint(args)    |                 |                       |
  |||          |||          ||+--------------------------------------->  1/3, wait            |
  |||          ||+---------------------------------------------------->  2/3, mint            |
  |||          |||          |||         |           |                 +----------------------->
  |||          |||          |||         |           |                 |                       |
```

#### Adding 4th voter
To add 4th voter the Congress needs 2 trust votes of 3 participants.
```
Voter1       Voter2       Voter3      Voter4      Voter5           Congress 
  |||          |||          |||         |           |                 |                     
  |||          |||          |||    10.trust(Voter4) |                 |                     
  |||          |||          ||+---------------------------------------> 1/3, wait            
  |||          ||+----------------------------------------------------> 2/3, trust, =4 voters 
  |||          |||          |||        |||          |                 |
```

#### Minting with 3/4 consensus
With 4 voters proposal needs to get 3 votes to execute. 
```
Voter1       Voter2       Voter3      Voter4      Voter5           Congress                 Token
  |||          |||          |||         |||         |                 |                       |
  |||          |||          11. mint(args...)       |                 |                       |
  |||          ||+----------------------------------------------------> 1/4, wait             |
  |||          |||          ||+---------------------------------------> 2/4, wait             |
  |||          |||          |||         ||+---------------------------> 3/4, mint             |
  |||          |||          |||         |||         |                 +----------------------->
  |||          |||          |||         |||         |                 |                       |
```
The configuration can be changed to any number of voters (_trust_ actions extend voters list, _untrust_ - collapse it).

## Test

Running tests
```
npm install
npm run test
```
or see latest test results on [travis](https://travis-ci.org/OnGridSystems/UniGoldCoin)


## Authors
* [Kirill Varlamov](https://github.com/ongrid)
* [Dmitry Romanov](https://github.com/onionglass)
* other guys from [OnGrid Systems]((https://github.com/OnGridSystems/))
