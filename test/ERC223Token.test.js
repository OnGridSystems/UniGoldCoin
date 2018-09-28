const {assertRevert} = require('./helpers/assertRevert');
const ERC223Token = artifacts.require("ERC223Mock");
const TokenFallbackMock = artifacts.require("TokenFallbackMock");
const BigNumber = web3.BigNumber;
require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

// ERC223 contract token test
contract('ERC223Token', async (accounts) => {
    // 5Billion * 10^18 Xti tokens as initial supply
    const initialSupply = 1000;
    const ownerBalance = initialSupply;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const ownerAddress = accounts[0];
    const anotherAccount = accounts[1];

    const _name = 'UniGoldCoin';
    const _symbol = 'UGCС';
    const _decimals = 0;

    // Create contract and token
    beforeEach(async function () {
        // Create the token with the preallocated supply and add all the tokens to ownerAddress
        this.token = await ERC223Token.new(initialSupply, ownerBalance);
        this.tokenFallbackMock = await TokenFallbackMock.new();
    });

    describe('transfer()', function () {
        it('transfer to another address without data', async function () {
            let amount = 10;
            await this.token.transfer(anotherAccount, amount);
            let value = await this.token.balanceOf(anotherAccount);
            assert.equal(value, amount);
        });

        it('transfer to another address with data', async function () {
            let amount = 10;
            await this.token.contract.transfer['address,uint256,bytes'](anotherAccount, amount, '', {from: ownerAddress});
            let value = await this.token.balanceOf(anotherAccount);
            assert.equal(value, amount);
        });

        it('transfer to contract address without data', async function () {
            let amount = 10;
            let fallBackContract = this.tokenFallbackMock.address;
            await this.token.transfer(fallBackContract, amount);
            let value = await this.tokenFallbackMock.value();
            assert.equal(value, amount);
        });

        it('transfer to contract address with data', async function () {
            let amount = 10;
            let fallBackContract = this.tokenFallbackMock.address;
            await this.token.contract.transfer['address,uint256,bytes'](fallBackContract, amount, '', {from: ownerAddress});
            let value = await this.tokenFallbackMock.value();
            assert.equal(value, amount);
        });

        describe('when the sender does not have enough balance', function () {
            it('revert', async function () {
                let amount = ownerBalance + 1;
                let fallBackContract = this.tokenFallbackMock.address;
                await assertRevert(this.token.transfer(anotherAccount, amount));
                await assertRevert(this.token.transfer(fallBackContract, amount));
            });
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
