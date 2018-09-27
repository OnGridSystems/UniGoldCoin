const {assertRevert} = require('./helpers/assertRevert');
const ERC223Token = artifacts.require("UniGoldTokenMock");
const TokenFallbackMock = artifacts.require("TokenFallbackMock");
const BigNumber = web3.BigNumber;
require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

// ERC223 contract token test
contract('UniGoldTokenMock', async (accounts) => {
    // 5Billion * 10^18 Xti tokens as initial supply
    const SUPPLY = 1000;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const ownerAddress = accounts[0];
    const anotherAccount = accounts[1];

    const _name = 'UniGoldCoin';
    const _symbol = 'UGCС';
    const _decimals = 0;

    // Create contract and token
    beforeEach(async function () {
        // Create the token with the preallocated supply and add all the tokens to ownerAddress
        this.token = await ERC223Token.new();
        this.tokenFallbackMock = await TokenFallbackMock.new();
        await this.token.mint(ownerAddress, SUPPLY);
    });

    describe('transfer()', function () {
        // Transfer to the contract address will call the token fallback
        it('should call token fallback and update mock state', async function () {
            let amount = 10;
            const fallBackContract = this.tokenFallbackMock.address;

            // Transfer without data
            await this.token.transfer(fallBackContract, 10);

            // Check that the mock fallback contract's state was updated
            let value = await this.tokenFallbackMock.value();
            assert.equal(value, amount);

            let from = await this.tokenFallbackMock.from();
            assert.equal(ownerAddress, from);

            // Change amount for second test
            amount = 100;

            // Workaround for overloaded function until Truffle adds support.
            // Must call contract with the function definition including parameters AND the from address included
            await this.token.contract.transfer['address,uint256,bytes'](fallBackContract, amount, '', {from: ownerAddress});
            // Check that the amount was updated
            value = await this.tokenFallbackMock.value();
            assert.equal(value, amount);

            //To address
            amount = 10;
            // Transfer without data
            await this.token.transfer(anotherAccount, amount);

            // Check balance
            value = await this.token.balanceOf(anotherAccount);
            assert.equal(value, amount);

            // Transfer with data
            amount = 100;
            await this.token.contract.transfer['address,uint256,bytes'](anotherAccount, amount, '', {from: ownerAddress});
            value = await this.token.balanceOf(anotherAccount);
            assert.equal(value, 110);

        });


        describe('when the recipient is the zero address', function () {
            const to = ZERO_ADDRESS;
            it('reverts', async function () {
                await assertRevert(this.token.transfer(to, 1, {from: ownerAddress}));
            });
        });

    });

    describe('Details', function () {
        it('has a name', async function () {
            const name = await this.token.name();
            name.should.be.equal(_name);
        });

        it('has a symbol', async function () {
            const symbol = await this.token.symbol();
            symbol.should.be.equal(_symbol);
        });

        it('has an amount of decimals', async function () {
            const decimals = await this.token.decimals();
            decimals.should.be.bignumber.equal(_decimals);
        });
    });

});
