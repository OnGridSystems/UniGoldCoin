pragma solidity ^0.4.16;

/**
 * @title Abstract contract where privileged minting managed by governance
 */
contract MintableTokenStub {
    address public minter;
    event Mint(address indexed to, uint256 amount);

    function mint(address _to, uint256 _amount) public onlyMinter returns (bool)
    {
        emit Mint(_to, _amount);
        return true;
    }

    /**
     * Constructor function
     */
    constructor (
        address _minter
    ) public {
        minter = _minter;
    }

    /**
     * @dev Throws if called by any account other than the minter.
     */
    modifier onlyMinter() {
        require(msg.sender == minter);
        _;
    }
}


/**
 * @title Congress contract
 * @dev idea based on congress contract from official Ethereum repo
 * See https://github.com/ethereum/ethereum-org/blob/master/solidity/dao-congress.sol
 */

contract Congress {
    uint public voters;
    mapping (address => bool) public voter;
    mapping (bytes32 => MintProposal) mintProposal;
    mapping (address => TrustRecord) public trustRegistry;
    MintableTokenStub public token;

    event TokenSet(address voter, address token);
    event MintProposalAdded(bytes32 proposalHash, address to, uint amount, string batchCode);
    event MintProposalVoted(bytes32 proposalHash, address voter, uint numberOfVotes);
    event MintProposalExecuted(bytes32 proposalHash, address to, uint amount, string batchCode);
    event TrustSet(address issuer, address subject);
    event TrustUnset(address issuer, address subject);
    event VoteGranted(address voter);
    event VoteRevoked(address voter);


    struct MintProposal {
        bool executed;
        uint numberOfVotes;
        mapping (address => bool) voted;
    }


    struct TrustRecord {
        uint256 totalTrust;
        mapping (address => bool) trustedBy;
    }


    // Modifier that allows only shareholders to vote
    modifier onlyVoters {
        require(voter[msg.sender]);
        _;
    }

    /**
     * Constructor function
     */
    constructor () public {
        voter[msg.sender] = true;
        voters = 1;
    }


    function isMajority(uint256 votes) view public returns (bool) {
        // ToDo SafeMath
        return (votes >=  voters / 2 + 1);
    }

    function getTotalTrust(address subject) view public returns (uint256) {
        return (trustRegistry[subject].totalTrust);
    }

    function trust(address _subject) onlyVoters public {
        require(msg.sender != _subject);
        require(token != MintableTokenStub(0));
        if (!trustRegistry[_subject].trustedBy[msg.sender]) {
            trustRegistry[_subject].trustedBy[msg.sender] = true;
            trustRegistry[_subject].totalTrust += 1;
            emit TrustSet(msg.sender, _subject);
            if (!voter[_subject] && isMajority(trustRegistry[_subject].totalTrust)) {
                voter[_subject] = true;
                // ToDo SafeMath
                voters += 1;
                emit VoteGranted(_subject);
            }
            return;
        }
        revert();
    }

    function untrust(address _subject) onlyVoters public {
        require(token != MintableTokenStub(0));
        if (trustRegistry[_subject].trustedBy[msg.sender]) {
            trustRegistry[_subject].trustedBy[msg.sender] = false;
            trustRegistry[_subject].totalTrust -= 1;
            emit TrustUnset(msg.sender, _subject);
            if (voter[_subject] && !isMajority(trustRegistry[_subject].totalTrust)) {
                voter[_subject] = false;
                // ToDo SafeMath
                voters -= 1;
                emit VoteRevoked(_subject);
            }
            return;
        }
        revert();
    }

    function setToken(
        MintableTokenStub _token
    )
        public
        onlyVoters
    {
        require(_token != MintableTokenStub(0));
        require(token == MintableTokenStub(0));
        token = _token;
        emit TokenSet(msg.sender, token);
    }

    /**
    * @dev Proxy function to vote and mint tokens
    * @param to The address that will receive the minted tokens.
    * @param amount The amount of tokens to mint.
    * @param batchCode The detailed information on a batch.
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(
        address to,
        uint256 amount,
        string batchCode
    )
        public
        onlyVoters
        returns (bool)
    {
        bytes32 proposalHash = keccak256(abi.encodePacked(to, amount, batchCode));
        assert(!mintProposal[proposalHash].executed);
        // ToDo safe math
        if (!mintProposal[proposalHash].voted[msg.sender]) {
            if ( mintProposal[proposalHash].numberOfVotes == 0 ) {
                emit MintProposalAdded(proposalHash, to, amount, batchCode);
            }
            // ToDo SafeMath
            mintProposal[proposalHash].numberOfVotes += 1;
            mintProposal[proposalHash].voted[msg.sender] = true;
            emit MintProposalVoted(proposalHash, msg.sender, mintProposal[proposalHash].numberOfVotes);
        }
        if (isMajority(mintProposal[proposalHash].numberOfVotes)) {
            mintProposal[proposalHash].executed = true;
            token.mint(to, amount);
            emit MintProposalExecuted(proposalHash, to, amount, batchCode);
        }
        return(true);
    }
}