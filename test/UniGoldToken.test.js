const {assertRevert} = require('./helpers/assertRevert');
const UniGoldToken = artifacts.require('UniGoldToken');
const { inLogs } = require('./helpers/expectEvent');

contract('UniGoldToken', function ([_, owner, recipient, anotherAccount, accounts]) {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const minter = anotherAccount;

    beforeEach(async function () {
        this.token = await UniGoldToken.new(minter, {from: owner});
        await this.token.mint(owner, 100, {from: minter});
    });

    describe('decimals', function () {
        it('returns the decimals', async function () {
            const decimals = await this.token.decimals();
            assert.equal(decimals, 4);
        });
    });

    describe('name', function () {
        it('returns the decimals', async function () {
            const name = await this.token.name();
            assert.equal(name, "UniGoldCoin");
        });
    });

    describe('symbol', function () {
        it('returns the decimals', async function () {
            const symbol = await this.token.symbol();
            assert.equal(symbol, "UGCС");
        });
    });

    describe('total supply', function () {
        it('returns the total amount of tokens', async function () {
            const totalSupply = await this.token.totalSupply();
            assert.equal(totalSupply, 100);
        });
    });

    describe('balanceOf', function () {
        describe('when the requested account has no tokens', function () {
            it('returns zero', async function () {
                const balance = await this.token.balanceOf(anotherAccount);

                assert.equal(balance, 0);
            });
        });

        describe('when the requested account has some tokens', function () {
            it('returns the total amount of tokens', async function () {
                const balance = await this.token.balanceOf(owner);

                assert.equal(balance, 100);
            });
        });
    });

    describe('transfer', function () {
        describe('when the recipient is not the zero address', function () {
            const to = recipient;

            describe('when the sender does not have enough balance', function () {
                const amount = 101;

                it('reverts', async function () {
                    await assertRevert(this.token.transfer(to, amount, {from: owner}));
                });
            });

            describe('when the sender has enough balance', function () {
                const amount = 100;

                it('transfers the requested amount', async function () {
                    await this.token.transfer(to, amount, {from: owner});

                    const senderBalance = await this.token.balanceOf(owner);
                    assert.equal(senderBalance, 0);

                    const recipientBalance = await this.token.balanceOf(to);
                    assert.equal(recipientBalance, amount);
                });

                it('emits a transfer event', async function () {
                    const {logs} = await this.token.transfer(to, amount, {from: owner});

                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'Transfer');
                    assert.equal(logs[0].args.from, owner);
                    assert.equal(logs[0].args.to, to);
                    assert(logs[0].args.value.eq(amount));
                });
            });
        });

        describe('when the recipient is the zero address', function () {
            const to = ZERO_ADDRESS;
            it('reverts', async function () {
                await assertRevert(this.token.transfer(to, 100, {from: owner}));
            });
        });
    });


    describe('minting', function () {
       it('another account cant mint', async function () {
           await assertRevert(this.token.mint(owner, 100, {from: owner}));
       });

       it('minter can mint', async function () {
           const totalSupply = await this.token.totalSupply();
           let amount = 100;
           await this.token.mint(owner, amount, {from: minter});
           let newSupply = await this.token.totalSupply();
           assert.equal(newSupply, +totalSupply + +amount);
       });

    });

    describe('burning', function () {
        const amount = 10;
        const initialBalance = 100;
        describe('when the given amount is not greater than balance of the sender', function () {


            beforeEach(async function () {
                ({ logs: this.logs } = await this.token.burn(amount, { from: owner }));
            });

            it('burns the requested amount', async function () {
                const balance = await this.token.balanceOf(owner);
                balance.should.be.bignumber.equal(initialBalance - amount);
            });

            it('emits a burn event', async function () {
                const event = await inLogs(this.logs, 'Burn');
                event.args.burner.should.eq(owner);
                event.args.value.should.be.bignumber.equal(amount);
            });

            it('emits a transfer event', async function () {
                const event = await inLogs(this.logs, 'Transfer');
                event.args.from.should.eq(owner);
                event.args.to.should.eq(ZERO_ADDRESS);
                event.args.value.should.be.bignumber.equal(amount);
            });
        });

        describe('when the given amount is greater than the balance of the sender', function () {
            it('reverts', async function () {
                await assertRevert(this.token.burn(initialBalance + 1, { from: owner }));
            });
        });
    });

});
