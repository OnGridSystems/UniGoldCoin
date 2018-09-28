const {assertRevert} = require('./helpers/assertRevert');
const UniGoldToken = artifacts.require('UniGoldToken');
const UniGoldCoinBurner = artifacts.require('UniGoldCoinBurner');

contract('UniGoldToken', function ([_, owner, recipient, anotherAccount]) {
    const initialBalance = 1000;
    const minter = owner;

    beforeEach(async function () {
        this.token = await UniGoldToken.new(minter);
        await this.token.mint(owner, initialBalance, {from: minter});
        this.tokenBurner = await UniGoldCoinBurner.new(this.token.address);
        await this.token.transfer(anotherAccount, 101, {from: minter});
        this.anotherToken = await UniGoldToken.new(anotherAccount, {from: anotherAccount});
        await this.anotherToken.mint(anotherAccount, initialBalance, {from: anotherAccount});
    });

    describe('burn 100 tokens', function () {
        const amount = 100;
        const from = owner;

        beforeEach(async function () {
            ({logs: this.logs} = await this.token.burn(amount, {from}));
        });

        it('totalSupply reduced by 100', async function () {
            const burner = this.tokenBurner.address;
            const initialSupply = await this.token.totalSupply();
            await this.token.transfer(burner, amount, {from: anotherAccount});
            //account balance reduce
            const balance = await this.token.balanceOf(anotherAccount);
            assert.equal(balance, 1);
            //totalSupply reduce
            const totalSupply = await this.token.totalSupply();
            assert.equal(totalSupply, initialSupply - amount);
        });

        it('emits a burn event', async function () {
            const tokenBurner = this.tokenBurner.address;
            const {logs} = await this.token.transfer(tokenBurner, 101, {from: owner});
            assert.equal(logs.length, 3);
            assert.equal(logs[0].event, 'Burn');
            assert.equal(logs[0].args.burner, tokenBurner);
            assert(logs[0].args.value.eq(101));
        });
    });

    describe('when the given amount is greater than the balance of the sender', function () {
        const amount = initialBalance + 1;
        it('reverts', async function () {
            await assertRevert(this.token.transfer(this.tokenBurner.address, amount, {from: owner}));
        });
    });

    describe('when trying to burn tokens from another contract address', function () {
        const amount = 1;
        it('reverts', async function () {
            await assertRevert(this.anotherToken.transfer(this.tokenBurner.address, amount, {from: anotherAccount}));
        });
    });

});
