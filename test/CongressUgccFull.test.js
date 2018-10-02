const {assertRevert} = require('./helpers/assertRevert');
const abiDecoder = require('abi-decoder');
const Congress = artifacts.require('Congress');
const Token = artifacts.require('UniGoldToken');

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Congress for UGCC', function ([_, ...accounts]) {

    describe('Congress deployed', function () {
        beforeEach(async function () {
            this.congress = await Congress.new({from: accounts[0]});
        });
        it('voter can not trust anybody until adds managed token', async function () {
            await assertRevert(this.congress.trust(accounts[0]));
            await assertRevert(this.congress.trust(accounts[1]));
            await assertRevert(this.congress.trust(accounts[2]));
        });
        describe('then UGCC token deployed and added', function () {
            beforeEach(async function () {
                this.token = await Token.new(this.congress.address, {from: accounts[0]});
                await this.congress.setToken(this.token.address, {from: accounts[0]});
            });
            it('voter can add others and form quorum', async function () {
                const {logs} = await this.congress.trust(accounts[1], {from: accounts[0]});
                assert.equal(logs.length, 2);
                assert.equal(logs[0].event, 'TrustSet');
                assert.equal(logs[0].args.issuer, accounts[0]);
                assert.equal(logs[0].args.subject, accounts[1]);
                assert.equal(logs[1].event, 'VoteGranted');
                assert.equal(logs[1].args.voter, accounts[1]);
            });
            it('voter can not add token twice', async function () {
                let otherToken = await Token.new(this.congress.address, {from: accounts[0]});
                await assertRevert(this.congress.setToken(otherToken.address, {from: accounts[0]}));
                await assertRevert(this.congress.setToken(0x0, {from: accounts[0]}));
            });

            it('voter can mint', async function () {
                let amount = 10000;
                let batchCode = "first Batch";

                let tx = await this.congress.mint(accounts[1], amount, batchCode, {from: accounts[0]});

                const receipt = await web3.eth.getTransactionReceipt(tx['tx']);

                abiDecoder.addABI(Congress.abi);
                abiDecoder.addABI(Token.abi);

                const decodedLogs = abiDecoder.decodeLogs(receipt.logs);

                assert.isTrue(decodedLogs.length >= 3);
                let llogs = decodedLogs.slice(-3);

                let mintEvent = llogs[0];

                assert.equal(mintEvent.name, 'Mint');
                assert.equal(mintEvent.events[1].value, amount);

                let transferEvent = llogs[1];
                assert.equal(transferEvent.name, 'Transfer');
                assert.equal(transferEvent.events[2].value, amount);

                let mintProposalExecutedEvent = llogs[2];
                assert.equal(mintProposalExecutedEvent.name, 'MintProposalExecuted');
                assert.equal(mintProposalExecutedEvent.events[2].value, amount);
                assert.equal(mintProposalExecutedEvent.events[3].value, batchCode);

            });

        });
    });
});
