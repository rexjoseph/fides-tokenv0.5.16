var FidesToken = artifacts.require("./FidesToken.sol");
var FidesTokenSale = artifacts.require("./FidesTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(FidesToken, 22000000).then(() => {

    // token price is set at 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(FidesTokenSale, FidesToken.address, tokenPrice);
  });
};