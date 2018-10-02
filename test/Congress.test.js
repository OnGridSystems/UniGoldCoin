const {assertRevert} = require('./helpers/assertRevert');
const Congress = artifacts.require('Congress');
const Token = artifacts.require('MintableTokenStub');

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Congress', function ([_, ...accounts]) {

    describe('Congress deployed', function () {
        beforeEach(async function () {
            this.congress = await Congress.new({from: accounts[0]});
        });
        it('voter can not trust anybody until adds managed token', async function () {
            await assertRevert(this.congress.trust(accounts[0]));
            await assertRevert(this.congress.trust(accounts[1]));
            await assertRevert(this.congress.trust(accounts[2]));
        });
        describe('then token deployed and added', function () {
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
        });
    });

    beforeEach(async function () {
        this.congress = await Congress.new({from: accounts[0]});
        this.token = await Token.new(this.congress.address, {from: accounts[0]});
        await this.congress.setToken(this.token.address, {from: accounts[0]});
    });

    describe('Quorum operations', function () {

        describe('initial owner is the voter', function () {
            it('voters/majority is 1/1', async function () {
                (await this.congress.voters()).should.be.bignumber.equal(1);
                (await this.congress.isMajority(1)).should.be.equal(true);
            });
            it('voters matrix', async function () {
                (await this.congress.voter(accounts[0])).should.be.equal(true);
                (await this.congress.voter(accounts[1])).should.be.equal(false);
                (await this.congress.voter(accounts[2])).should.be.equal(false);
                (await this.congress.voter(accounts[3])).should.be.equal(false);
                (await this.congress.voter(accounts[4])).should.be.equal(false);
                (await this.congress.voter(accounts[5])).should.be.equal(false);
            });
            it('trust matrix', async function () {
                (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
            });
            it('voter can not trust himself', async function () {
                await assertRevert(this.congress.trust(accounts[0]));
            });
            it('voter can not untrust himself', async function () {
                await assertRevert(this.congress.untrust(accounts[0]));
            });
            it('non-voter can not trust', async function () {
                await assertRevert(this.congress.trust(accounts[0], {from: accounts[1]}));
                await assertRevert(this.congress.trust(accounts[1], {from: accounts[1]}));
                await assertRevert(this.congress.trust(accounts[2], {from: accounts[1]}));
            });
            it('non-voter can not untrust', async function () {
                await assertRevert(this.congress.untrust(accounts[0], {from: accounts[1]}));
                await assertRevert(this.congress.untrust(accounts[1], {from: accounts[1]}));
                await assertRevert(this.congress.untrust(accounts[2], {from: accounts[1]}));
            });
        });

        describe('Owner claims trust to Acc1', function () {

            beforeEach(async function () {
                const {logs} = await this.congress.trust(accounts[1], {from: accounts[0]});
                this.logs = logs;
            });

            it('TrustSet and VoteGranted logs were emitted', async function () {
                logs = this.logs;
                assert.equal(logs.length, 2);
                assert.equal(logs[0].event, 'TrustSet');
                assert.equal(logs[0].args.issuer, accounts[0]);
                assert.equal(logs[0].args.subject, accounts[1]);
                assert.equal(logs[1].event, 'VoteGranted');
                assert.equal(logs[1].args.voter, accounts[1]);
            });

            it('voters/majority is 2/2', async function () {
                (await this.congress.voters()).should.be.bignumber.equal(2);
                (await this.congress.isMajority(1)).should.be.equal(false);
                (await this.congress.isMajority(2)).should.be.equal(true);
            });

            it('voters matrix', async function () {
                (await this.congress.voter(accounts[0])).should.be.equal(true);
                (await this.congress.voter(accounts[1])).should.be.equal(true);
                (await this.congress.voter(accounts[2])).should.be.equal(false);
                (await this.congress.voter(accounts[3])).should.be.equal(false);
                (await this.congress.voter(accounts[4])).should.be.equal(false);
                (await this.congress.voter(accounts[5])).should.be.equal(false);
            });
            it('trust matrix', async function () {
                (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
            });

            it('Acc1 can not untrust Acc0, it never claimed trust', async function () {
                await assertRevert(this.congress.untrust(accounts[0], {from: accounts[1]}));
            });

            describe('Acc0 unclaims trust from Acc1', function () {
                beforeEach(async function () {
                    const {logs} = await this.congress.untrust(accounts[1], {from: accounts[0]});
                    this.logs = logs;
                });

                it('TrustUnset and VoteRevoked logs were emitted', async function () {
                    logs = this.logs;
                    assert.equal(logs.length, 2);
                    assert.equal(logs[0].event, 'TrustUnset');
                    assert.equal(logs[0].args.issuer, accounts[0]);
                    assert.equal(logs[0].args.subject, accounts[1]);
                    assert.equal(logs[1].event, 'VoteRevoked');
                    assert.equal(logs[1].args.voter, accounts[1]);
                });

                it('voters/majority is 1/1', async function () {
                    (await this.congress.voters()).should.be.bignumber.equal(1);
                    (await this.congress.isMajority(1)).should.be.equal(true);
                    (await this.congress.isMajority(2)).should.be.equal(true);
                });

                it('voters matrix', async function () {
                    (await this.congress.voter(accounts[0])).should.be.equal(true);
                    (await this.congress.voter(accounts[1])).should.be.equal(false);
                    (await this.congress.voter(accounts[2])).should.be.equal(false);
                    (await this.congress.voter(accounts[3])).should.be.equal(false);
                    (await this.congress.voter(accounts[4])).should.be.equal(false);
                    (await this.congress.voter(accounts[5])).should.be.equal(false);
                });
                it('trust matrix', async function () {
                    (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                    (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(0);
                    (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(0);
                    (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(0);
                    (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                    (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                });

            });

            describe('Acc1 claims trust to Acc2', function () {
                beforeEach(async function () {
                    const {logs} = await this.congress.trust(accounts[2], {from: accounts[1]});
                    this.logs = logs;
                });


                it('TrustSet log was emitted', async function () {
                    logs = this.logs;
                    assert.equal(logs.length, 1);
                    assert.equal(logs[0].event, 'TrustSet');
                    assert.equal(logs[0].args.issuer, accounts[1]);
                    assert.equal(logs[0].args.subject, accounts[2]);
                });

                it('voters/majority is 2/2', async function () {
                    (await this.congress.voters()).should.be.bignumber.equal(2);
                    (await this.congress.isMajority(1)).should.be.equal(false);
                    (await this.congress.isMajority(2)).should.be.equal(true);
                });

                it('voters matrix', async function () {
                    (await this.congress.voter(accounts[0])).should.be.equal(true);
                    (await this.congress.voter(accounts[1])).should.be.equal(true);
                    (await this.congress.voter(accounts[2])).should.be.equal(false);
                    (await this.congress.voter(accounts[3])).should.be.equal(false);
                    (await this.congress.voter(accounts[4])).should.be.equal(false);
                    (await this.congress.voter(accounts[5])).should.be.equal(false);
                });
                it('trust matrix', async function () {
                    (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                    (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                    (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(1);
                    (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(0);
                    (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                    (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                });

                it('Acc2 unable to claim trust to anybody (not a voter yet)', async function () {
                    await assertRevert(this.congress.trust(accounts[0], {from: accounts[2]}));
                    await assertRevert(this.congress.trust(accounts[1], {from: accounts[2]}));
                    await assertRevert(this.congress.trust(accounts[2], {from: accounts[2]}));
                    await assertRevert(this.congress.trust(accounts[3], {from: accounts[2]}));
                });

                describe('Acc1 unclaims trust from Acc2', function () {
                    beforeEach(async function () {
                        const {logs} = await this.congress.untrust(accounts[2], {from: accounts[1]});
                        this.logs = logs;
                    });

                    it('TrustUnset log was emitted', async function () {
                        logs = this.logs;
                        assert.equal(logs.length, 1);
                        assert.equal(logs[0].event, 'TrustUnset');
                        assert.equal(logs[0].args.issuer, accounts[1]);
                        assert.equal(logs[0].args.subject, accounts[2]);
                    });

                    it('voters/majority is 2/2', async function () {
                        (await this.congress.voters()).should.be.bignumber.equal(2);
                        (await this.congress.isMajority(1)).should.be.equal(false);
                        (await this.congress.isMajority(2)).should.be.equal(true);
                    });

                    it('voters matrix', async function () {
                        (await this.congress.voter(accounts[0])).should.be.equal(true);
                        (await this.congress.voter(accounts[1])).should.be.equal(true);
                        (await this.congress.voter(accounts[2])).should.be.equal(false);
                        (await this.congress.voter(accounts[3])).should.be.equal(false);
                        (await this.congress.voter(accounts[4])).should.be.equal(false);
                        (await this.congress.voter(accounts[5])).should.be.equal(false);
                    });
                    it('trust matrix', async function () {
                        (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                        (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                        (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(0);
                        (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(0);
                        (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                        (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                    });
                });

                describe('Acc0 claims trust to Acc2', function () {
                    beforeEach(async function () {
                        const {logs} = await this.congress.trust(accounts[2], {from: accounts[0]});
                        this.logs = logs;
                    });

                    it('TrustSet and VoteGranted logs were emitted', async function () {
                        logs = this.logs;
                        assert.equal(logs.length, 2);
                        assert.equal(logs[0].event, 'TrustSet');
                        assert.equal(logs[0].args.issuer, accounts[0]);
                        assert.equal(logs[0].args.subject, accounts[2]);
                        assert.equal(logs[1].event, 'VoteGranted');
                        assert.equal(logs[1].args.voter, accounts[2]);
                    });

                    it('voters/majority is 3/2', async function () {
                        (await this.congress.voters()).should.be.bignumber.equal(3);
                        (await this.congress.isMajority(1)).should.be.equal(false);
                        (await this.congress.isMajority(2)).should.be.equal(true);
                    });

                    it('voters matrix', async function () {
                        (await this.congress.voter(accounts[0])).should.be.equal(true);
                        (await this.congress.voter(accounts[1])).should.be.equal(true);
                        (await this.congress.voter(accounts[2])).should.be.equal(true);
                        (await this.congress.voter(accounts[3])).should.be.equal(false);
                        (await this.congress.voter(accounts[4])).should.be.equal(false);
                        (await this.congress.voter(accounts[5])).should.be.equal(false);
                    });
                    it('trust matrix', async function () {
                        (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                        (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                        (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(2);
                        (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(0);
                        (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                        (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                    });

                    describe('Acc0 unclaims trust from Acc2', function () {
                        beforeEach(async function () {
                            const {logs} = await this.congress.untrust(accounts[2], {from: accounts[0]});
                            this.logs = logs;
                        });

                        it('TrustUnset and VoteRevoked logs were emitted', async function () {
                            logs = this.logs;
                            assert.equal(logs.length, 2);
                            assert.equal(logs[0].event, 'TrustUnset');
                            assert.equal(logs[0].args.issuer, accounts[0]);
                            assert.equal(logs[0].args.subject, accounts[2]);
                            assert.equal(logs[1].event, 'VoteRevoked');
                            assert.equal(logs[1].args.voter, accounts[2]);
                        });

                        it('voters/majority is 2/2', async function () {
                            (await this.congress.voters()).should.be.bignumber.equal(2);
                            (await this.congress.isMajority(1)).should.be.equal(false);
                            (await this.congress.isMajority(2)).should.be.equal(true);
                        });

                        it('voters matrix', async function () {
                            (await this.congress.voter(accounts[0])).should.be.equal(true);
                            (await this.congress.voter(accounts[1])).should.be.equal(true);
                            (await this.congress.voter(accounts[2])).should.be.equal(false);
                            (await this.congress.voter(accounts[3])).should.be.equal(false);
                            (await this.congress.voter(accounts[4])).should.be.equal(false);
                            (await this.congress.voter(accounts[5])).should.be.equal(false);
                        });
                        it('trust matrix', async function () {
                            (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                            (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                            (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(1);
                            (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(0);
                            (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                            (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                        });
                    });

                    describe('Acc2 claims trust to Acc3', function () {
                        beforeEach(async function () {
                            const {logs} = await this.congress.trust(accounts[3], {from: accounts[2]});
                            this.logs = logs;
                        });

                        it('TrustSet log was emitted', async function () {
                            logs = this.logs;
                            assert.equal(logs.length, 1);
                            assert.equal(logs[0].event, 'TrustSet');
                            assert.equal(logs[0].args.issuer, accounts[2]);
                            assert.equal(logs[0].args.subject, accounts[3]);
                        });

                        it('voters/majority is 3/2', async function () {
                            (await this.congress.voters()).should.be.bignumber.equal(3);
                            (await this.congress.isMajority(1)).should.be.equal(false);
                            (await this.congress.isMajority(2)).should.be.equal(true);
                        });

                        it('voters matrix', async function () {
                            (await this.congress.voter(accounts[0])).should.be.equal(true);
                            (await this.congress.voter(accounts[1])).should.be.equal(true);
                            (await this.congress.voter(accounts[2])).should.be.equal(true);
                            (await this.congress.voter(accounts[3])).should.be.equal(false);
                            (await this.congress.voter(accounts[4])).should.be.equal(false);
                            (await this.congress.voter(accounts[5])).should.be.equal(false);
                        });
                        it('trust matrix', async function () {
                            (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                            (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                            (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(2);
                            (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(1);
                            (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                            (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                        });

                        describe('Acc2 unclaims trust from Acc3', function () {
                            beforeEach(async function () {
                                const {logs} = await this.congress.untrust(accounts[3], {from: accounts[2]});
                                this.logs = logs;
                            });

                            it('TrustUnset log was emitted', async function () {
                                logs = this.logs;
                                assert.equal(logs.length, 1);
                                assert.equal(logs[0].event, 'TrustUnset');
                                assert.equal(logs[0].args.issuer, accounts[2]);
                                assert.equal(logs[0].args.subject, accounts[3]);
                            });

                            it('voters/majority is 3/2', async function () {
                                (await this.congress.voters()).should.be.bignumber.equal(3);
                                (await this.congress.isMajority(1)).should.be.equal(false);
                                (await this.congress.isMajority(2)).should.be.equal(true);
                            });

                            it('voters matrix', async function () {
                                (await this.congress.voter(accounts[0])).should.be.equal(true);
                                (await this.congress.voter(accounts[1])).should.be.equal(true);
                                (await this.congress.voter(accounts[2])).should.be.equal(true);
                                (await this.congress.voter(accounts[3])).should.be.equal(false);
                                (await this.congress.voter(accounts[4])).should.be.equal(false);
                                (await this.congress.voter(accounts[5])).should.be.equal(false);
                            });
                            it('trust matrix', async function () {
                                (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                                (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                                (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(2);
                                (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(0);
                                (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                                (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                            });
                        });

                        describe('Acc1 claims trust to Acc3', function () {
                            beforeEach(async function () {
                                const {logs} = await this.congress.trust(accounts[3], {from: accounts[1]});
                                this.logs = logs;
                            });

                            it('TrustSet and VoteGranted logs were emitted', async function () {
                                logs = this.logs;
                                assert.equal(logs.length, 2);
                                assert.equal(logs[0].event, 'TrustSet');
                                assert.equal(logs[0].args.issuer, accounts[1]);
                                assert.equal(logs[0].args.subject, accounts[3]);
                                assert.equal(logs[1].event, 'VoteGranted');
                                assert.equal(logs[1].args.voter, accounts[3]);
                            });

                            it('voters/majority is 4/3', async function () {
                                (await this.congress.voters()).should.be.bignumber.equal(4);
                                (await this.congress.isMajority(2)).should.be.equal(false);
                                (await this.congress.isMajority(3)).should.be.equal(true);
                            });

                            it('voters matrix', async function () {
                                (await this.congress.voter(accounts[0])).should.be.equal(true);
                                (await this.congress.voter(accounts[1])).should.be.equal(true);
                                (await this.congress.voter(accounts[2])).should.be.equal(true);
                                (await this.congress.voter(accounts[3])).should.be.equal(true);
                                (await this.congress.voter(accounts[4])).should.be.equal(false);
                                (await this.congress.voter(accounts[5])).should.be.equal(false);
                            });
                            it('trust matrix', async function () {
                                (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                                (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                                (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(2);
                                (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(2);
                                (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(0);
                                (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                            });

                            // ToDo Acc1 untrust Acc3

                            describe('Acc0 claims trust to Acc4', function () {
                                beforeEach(async function () {
                                    const {logs} = await this.congress.trust(accounts[4], {from: accounts[0]});
                                    this.logs = logs;
                                });

                                it('TrustSet log was emitted', async function () {
                                    logs = this.logs;
                                    assert.equal(logs.length, 1);
                                    assert.equal(logs[0].event, 'TrustSet');
                                    assert.equal(logs[0].args.issuer, accounts[0]);
                                    assert.equal(logs[0].args.subject, accounts[4]);
                                });

                                it('voters/majority is 4/2', async function () {
                                    (await this.congress.voters()).should.be.bignumber.equal(4);
                                    (await this.congress.isMajority(2)).should.be.equal(false);
                                    (await this.congress.isMajority(3)).should.be.equal(true);
                                });

                                it('voters matrix', async function () {
                                    (await this.congress.voter(accounts[0])).should.be.equal(true);
                                    (await this.congress.voter(accounts[1])).should.be.equal(true);
                                    (await this.congress.voter(accounts[2])).should.be.equal(true);
                                    (await this.congress.voter(accounts[3])).should.be.equal(true);
                                    (await this.congress.voter(accounts[4])).should.be.equal(false);
                                    (await this.congress.voter(accounts[5])).should.be.equal(false);
                                });
                                it('trust matrix', async function () {
                                    (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                                    (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                                    (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(2);
                                    (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(2);
                                    (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(1);
                                    (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                                });

                                // ToDo Acc0 untrust Acc4

                                describe('Acc1 claims trust to Acc4', function () {
                                    beforeEach(async function () {
                                        const {logs} = await this.congress.trust(accounts[4], {from: accounts[1]});
                                        this.logs = logs;
                                    });

                                    it('TrustSet log was emitted', async function () {
                                        logs = this.logs;
                                        assert.equal(logs.length, 1);
                                        assert.equal(logs[0].event, 'TrustSet');
                                        assert.equal(logs[0].args.issuer, accounts[1]);
                                        assert.equal(logs[0].args.subject, accounts[4]);
                                    });

                                    it('voters/majority is 4/3', async function () {
                                        (await this.congress.voters()).should.be.bignumber.equal(4);
                                        (await this.congress.isMajority(2)).should.be.equal(false);
                                        (await this.congress.isMajority(3)).should.be.equal(true);
                                    });

                                    it('voters matrix', async function () {
                                        (await this.congress.voter(accounts[0])).should.be.equal(true);
                                        (await this.congress.voter(accounts[1])).should.be.equal(true);
                                        (await this.congress.voter(accounts[2])).should.be.equal(true);
                                        (await this.congress.voter(accounts[3])).should.be.equal(true);
                                        (await this.congress.voter(accounts[4])).should.be.equal(false);
                                        (await this.congress.voter(accounts[5])).should.be.equal(false);
                                    });
                                    it('trust matrix', async function () {
                                        (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                                        (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                                        (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(2);
                                        (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(2);
                                        (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(2);
                                        (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                                    });

                                    // ToDo Acc1 untrust Acc4

                                    describe('Acc3 claims trust to Acc4', function () {
                                        beforeEach(async function () {
                                            const {logs} = await this.congress.trust(accounts[4], {from: accounts[3]});
                                            this.logs = logs;
                                        });

                                        it('TrustSet and VoteGranted logs were emitted', async function () {
                                            logs = this.logs;
                                            assert.equal(logs.length, 2);
                                            assert.equal(logs[0].event, 'TrustSet');
                                            assert.equal(logs[0].args.issuer, accounts[3]);
                                            assert.equal(logs[0].args.subject, accounts[4]);
                                            assert.equal(logs[1].event, 'VoteGranted');
                                            assert.equal(logs[1].args.voter, accounts[4]);
                                        });

                                        it('voters/majority is 5/3', async function () {
                                            (await this.congress.voters()).should.be.bignumber.equal(5);
                                            (await this.congress.isMajority(2)).should.be.equal(false);
                                            (await this.congress.isMajority(3)).should.be.equal(true);
                                        });

                                        it('voters matrix', async function () {
                                            (await this.congress.voter(accounts[0])).should.be.equal(true);
                                            (await this.congress.voter(accounts[1])).should.be.equal(true);
                                            (await this.congress.voter(accounts[2])).should.be.equal(true);
                                            (await this.congress.voter(accounts[3])).should.be.equal(true);
                                            (await this.congress.voter(accounts[4])).should.be.equal(true);
                                            (await this.congress.voter(accounts[5])).should.be.equal(false);
                                        });
                                        it('trust matrix', async function () {
                                            (await this.congress.getTotalTrust(accounts[0])).should.be.bignumber.equal(0);
                                            (await this.congress.getTotalTrust(accounts[1])).should.be.bignumber.equal(1);
                                            (await this.congress.getTotalTrust(accounts[2])).should.be.bignumber.equal(2);
                                            (await this.congress.getTotalTrust(accounts[3])).should.be.bignumber.equal(2);
                                            (await this.congress.getTotalTrust(accounts[4])).should.be.bignumber.equal(3);
                                            (await this.congress.getTotalTrust(accounts[5])).should.be.bignumber.equal(0);
                                        });

                                        // ToDo Acc3 untrust Acc4
                                    });
                                });
                            });
                        });
                    });

                });

            });

            /*
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
            */
        });

    });

    describe('Mint operations', function () {

        it('Non-voter unable to initiate/vote for minting', async function () {
            await assertRevert(this.congress.mint(accounts[0], 1, "bla", {from: accounts[1]}));
        });

        it('Initial voter is able to mint', async function () {
            // ToDo check logs here
            //(await this.congress.mint(accounts[1], 1, "big brother batch", {from: accounts[0]}))
            //should.be.equal(true);
        });
    });
});
