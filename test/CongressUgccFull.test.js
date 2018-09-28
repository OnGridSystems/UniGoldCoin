const {assertRevert} = require('./helpers/assertRevert');
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
                tx = await this.congress.mint(accounts[1], 10000, "first Batch", {from: accounts[0]});
                //logs = tx['logs'];
                //assert.equal(logs.length, 3);
                //assert.equal(logs[0].event, 'MintProposalAdded');
                //assert.equal(logs[1].event, 'MintProposalVoted');
                //assert.equal(logs[2].event, 'MintProposalExecuted');
                console.log(tx['tx']);
                const receipt = await web3.eth.getTransactionReceipt(tx['tx']);
                const logs = decodeLogs(receipt.logs, Congress, token.address);
                logs.length.should.equal(1);
                logs[0].event.should.equal('Transfer');
            });
        });
    });
});
