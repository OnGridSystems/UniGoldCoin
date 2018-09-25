# UniGoldCoin
Indivisible token representing the right to claim physical gold coin. 
The digital token gets created after phisical gold coin batch gets minted. 
The creaton of the digital tokens governed by quorum of 3/5 votes.

## Contracts
### Token
* **Interface: ERC-223*** (ERC-20 compatible). ERC-20 is the most liquid form of the token 
supported by most exchenges, both legacy and decentralized. ERC-223 supports additional 
functionality of receiving contract supporting more automation. For example, the token 
can be burnt automatically when received, we use this to guarantee its invalidation after
owner claimed its physical coins;
* **Decimals: 0** symbolizes the token indivisibility. We deliberately use zero decimal to
guarantee physical coin never loss its fractions of value and will remain intact traversing 
exchanges. We are aware that some exchanges extract fees from the tokens, they won't list;
our token. Anyway this implementation has better liquidity than ERC-721 non-fungible tokens.
* **Symbol: UGCС**, UGC has been already used at the moments and we's like to have the 
non-conflicting ticker code;
* **Name: “UniGoldCoin”**;
* **Network: Ethereum mainnet** - main Ethereum network is second value-transfer peer-to-peer 
system after Bitcoin. The most of the token ecosystem is concentrated around Ethereum mainnet;
* **Burnable: yes** - the ability to discard **own** tokens is always a good idea. Any holder 
can throw its tokens, but has no interest to do this. The platform burns received tokens
when the physical artifact gets reclaimed. Burning decreases circulating supply, economic 
analysts interpret these events as strong inflation signals;
* **Approvable: no** - the very limited supply and indivisibility makes the spending approval
non-useful in practice, so we discarded this functionality to keep the token compact and efficient;
* **Mintable: yes, through quorum of voters** - The emission gets triggered when each new batch of
the tokens leaves manufacturing facility. To avoid voluntary minting and situations when minority 
of the controlling private keys get stolen or compromised we allow minting via quorum of votes 3 of 5.
Mint function has a difference against reference implementation (OpenZeppelin), it gets the string of
the batch name as the argument and corresponding event has the name field to track transaction to 
batch relation via Tx receipt.
* **Cap: no** - The maximum circulating amount of tokens will never exceed the number of 
physisal coins. After the coins get reclaimed, and tokens get burnt, the token amount in 
the wild will be less than a number of existing gold coins. There is no solution at the moment
to enforce this technically.

### Burner

TBD

### Governance

TBD


