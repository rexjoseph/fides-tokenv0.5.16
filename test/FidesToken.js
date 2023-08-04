var FidesToken = artifacts.require("./FidesToken.sol");

contract('FidesToken', function(accounts) {

  it('sets total supply upon deployment', () => {
    return FidesToken.deployed().then((instance) => {
      tokenInstance = instance;
      return tokenInstance.totalSupply();
    }).then((totalSupply) => {
      assert.equal(totalSupply.toNumber(), 22000000, 'sets the total supply to 22,000,000');
    });
  });
})
